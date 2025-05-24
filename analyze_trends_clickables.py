import asyncio
import json
import sys
import base64
from playwright.sync_api import sync_playwright, TimeoutError as PlaywrightTimeoutError
import traceback
import os

# --- Helper Function for String Sanitization ---
def _sanitize_string_for_utf8(s_val: any) -> str:
    """
    Ensures the input is a string and sanitizes it for UTF-8 encoding
    by replacing problematic bytes.
    """
    if not isinstance(s_val, str):
        s_val = str(s_val)
    # Encode to UTF-8, replacing errors, then decode back to a Python (Unicode) string.
    # This ensures the string is "clean" for later UTF-8 encoding by json.dumps().encode().
    # Using 'ignore' on decode as well for maximum safety, though 'replace' on encode should handle most.
    return s_val.encode('utf-8', errors='replace').decode('utf-8', errors='ignore')

# --- Helper Class for DOM Element Information ---
class DOMElementInfo:
    """
    DOM 요소의 상세 정보를 담기 위한 내부 헬퍼 클래스입니다.
    최종적으로 이 클래스의 인스턴스를 to_dict()를 통해 딕셔너리로 변환하여 사용합니다.
    api.py의 ElementInfo Pydantic 모델과 필드 구조를 일치시켜야 합니다.
    """
    def __init__(self, tag: str, attributes: dict, xpath: str, text: str, bounding_box: dict,
                 inner_html: str = "", outer_html: str = ""):
        self.tag = _sanitize_string_for_utf8(tag)
        self.attributes = {
            _sanitize_string_for_utf8(k): _sanitize_string_for_utf8(v)
            for k, v in attributes.items()
        } if attributes else {}
        self.xpath = _sanitize_string_for_utf8(xpath)
        self.text = _sanitize_string_for_utf8(text) # 요소의 가시적인 텍스트 내용
        self.bounding_box = bounding_box # 예: {"x": float, "y": float, "width": float, "height": float}
        self.inner_html = _sanitize_string_for_utf8(inner_html) # 요소 내부의 HTML
        self.outer_html = _sanitize_string_for_utf8(outer_html) # 요소를 포함한 HTML

    def to_dict(self) -> dict:
        """ElementInfo Pydantic 모델과 호환되는 딕셔너리를 반환합니다."""
        return {
            "tag": self.tag,
            "attributes": self.attributes,
            "xpath": self.xpath,
            "text": self.text,
            "bounding_box": self.bounding_box,
            "inner_html": self.inner_html,
            "outer_html": self.outer_html,
        }

# --- DOM Processing Logic ---
class DOMProcessor:
    """
    Playwright 페이지 객체를 받아 DOM 정보를 추출하고 구조화합니다.
    """
    def __init__(self, page, build_dom_tree_script_path=None):
        self.page = page
        self.build_dom_tree_script_path = build_dom_tree_script_path
        self.build_dom_tree_script_content = None

        if self.build_dom_tree_script_path and os.path.exists(self.build_dom_tree_script_path):
            try:
                with open(self.build_dom_tree_script_path, 'r', encoding='utf-8') as f:
                    self.build_dom_tree_script_content = f.read()
                print(f"[sync_browser - DOMProcessor] '{self.build_dom_tree_script_path}' 스크립트 로드 완료.", file=sys.stderr)
            except Exception as e:
                print(f"[sync_browser - DOMProcessor] 경고: '{self.build_dom_tree_script_path}' 스크립트 로드 실패: {e}", file=sys.stderr)
                self.build_dom_tree_script_content = None

    def _generate_robust_xpath(self, element_handle) -> str:
        try:
            xpath = element_handle.evaluate("""
                element => {
                    const getPathTo = (el) => {
                        if (!el || el.nodeType !== 1) return '';
                        if (el.id) return `id("${el.id}")`;
                        if (el.tagName === 'BODY') return '/html/body';
                        if (el.tagName === 'HEAD') return '/html/head';
                        if (el.tagName === 'HTML') return '/html';

                        let ix = 0;
                        const siblings = el.parentNode ? Array.from(el.parentNode.children) : [];
                        for (let i = 0; i < siblings.length; i++) {
                            const sibling = siblings[i];
                            if (sibling === el) {
                                const parentPath = getPathTo(el.parentNode);
                                return parentPath + '/' + el.tagName.toLowerCase() + '[' + (ix + 1) + ']';
                            }
                            if (sibling.nodeType === 1 && sibling.tagName === el.tagName) {
                                ix++;
                            }
                        }
                        return '/' + el.tagName.toLowerCase();
                    };
                    return getPathTo(element);
                }
            """, element_handle)
            return _sanitize_string_for_utf8(xpath)
        except Exception:
            try:
                return _sanitize_string_for_utf8(element_handle.evaluate("el => el.tagName.toLowerCase()"))
            except:
                return "unknown_xpath_error"

    def get_structured_dom_info(self) -> list:
        print("[sync_browser - DOMProcessor] 구조화된 DOM 정보 추출 시작...", file=sys.stderr)
        structured_elements_data = []

        if self.build_dom_tree_script_content:
            print("[sync_browser - DOMProcessor] buildDomTree.js 스크립트를 사용하여 DOM 정보 추출 시도...", file=sys.stderr)
            try:
                raw_elements_from_script = self.page.evaluate(f"(() => {{ {self.build_dom_tree_script_content}; return buildDomTree ? buildDomTree(document.body) : []; }})()")
                print(f"[sync_browser - DOMProcessor] buildDomTree.js로부터 {len(raw_elements_from_script)}개의 원시 요소 정보 수신.", file=sys.stderr)

                for raw_element in raw_elements_from_script:
                    bbox_from_script = raw_element.get('boundingClientRect') or raw_element.get('bounds')
                    bounding_box = {"x": 0, "y": 0, "width": 0, "height": 0}
                    if bbox_from_script:
                        bounding_box = {
                            "x": bbox_from_script.get("x", bbox_from_script.get("left", 0)),
                            "y": bbox_from_script.get("y", bbox_from_script.get("top", 0)),
                            "width": bbox_from_script.get("width", 0),
                            "height": bbox_from_script.get("height", 0)
                        }

                    if not isinstance(bounding_box.get("width"), (int, float)) or \
                       not isinstance(bounding_box.get("height"), (int, float)) or \
                       bounding_box["width"] == 0 or bounding_box["height"] == 0:
                        continue

                    element_info = DOMElementInfo(
                        tag=raw_element.get('tag', raw_element.get('nodeName', 'unknown')),
                        attributes=raw_element.get('attributes', {}),
                        xpath=raw_element.get('xpath', 'unknown_xpath_from_script'),
                        text=(raw_element.get('text', raw_element.get('textContent', '')) or ""),
                        bounding_box=bounding_box,
                        inner_html=(raw_element.get('innerHtml', '') or ""),
                        outer_html=(raw_element.get('outerHtml', '') or "")
                    )
                    structured_elements_data.append(element_info.to_dict())
                print(f"[sync_browser - DOMProcessor] buildDomTree.js 결과 파싱 완료. 유효 요소 {len(structured_elements_data)}개.", file=sys.stderr)
                if structured_elements_data:
                    return structured_elements_data
            except Exception as e_script:
                print(f"[sync_browser - DOMProcessor] buildDomTree.js 실행 또는 결과 파싱 중 오류: {e_script}", file=sys.stderr)
                print("[sync_browser - DOMProcessor] Playwright API 직접 사용 방식으로 대체합니다.", file=sys.stderr)
                structured_elements_data = []

        print("[sync_browser - DOMProcessor] Playwright API를 직접 사용하여 DOM 정보 추출 시도...", file=sys.stderr)
        try:
            selectors_to_try = [
                'button', 'a', 'input:not([type="hidden"])', 'select', 'textarea',
                '[role="button"]', '[role="link"]', '[role="menuitem"]', '[role="option"]', '[role="tab"]',
                '[onclick]', 'summary', 'details',
                'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'li', 'img', 'span', 'div'
            ]
            element_handles = []
            for selector in selectors_to_try:
                try:
                    handles = self.page.locator(selector).element_handles(timeout=3000)
                    element_handles.extend(handles)
                except PlaywrightTimeoutError: pass
                except Exception: pass
            
            print(f"[sync_browser - DOMProcessor] 초기 선택된 요소 핸들 수: {len(element_handles)}", file=sys.stderr)
            processed_count = 0
            MAX_ELEMENTS_TO_PROCESS = 300

            for el_handle in element_handles:
                if processed_count >= MAX_ELEMENTS_TO_PROCESS:
                    print(f"[sync_browser - DOMProcessor] 최대 처리 요소 개수 ({processed_count}개) 도달.", file=sys.stderr)
                    break
                try:
                    if not el_handle.is_visible(timeout=300):
                        continue

                    tag_name = el_handle.evaluate("element => element.tagName.toLowerCase()", timeout=300)
                    attributes = el_handle.evaluate("element => Array.from(element.attributes).reduce((obj, attr) => { obj[attr.name] = attr.value; return obj; }, {})", timeout=300)
                    text_content = (el_handle.text_content(timeout=500) or "")
                    
                    xpath_value = self._generate_robust_xpath(el_handle)
                    bounding_box = el_handle.bounding_box()

                    if not bounding_box or \
                       not isinstance(bounding_box.get("width"), (int, float)) or \
                       not isinstance(bounding_box.get("height"), (int, float)) or \
                       bounding_box['width'] == 0 or bounding_box['height'] == 0:
                        continue

                    element_info = DOMElementInfo(
                        tag=tag_name,
                        attributes=attributes,
                        xpath=xpath_value,
                        text=text_content.strip()[:200],
                        bounding_box=bounding_box
                        # inner_html and outer_html can be added here if needed, with sanitization
                    )
                    structured_elements_data.append(element_info.to_dict())
                    processed_count += 1
                except PlaywrightTimeoutError: pass
                except Exception: pass
                finally:
                    if el_handle:
                        try:
                            if el_handle.evaluate("() => true", timeout=100):
                                el_handle.dispose()
                        except: pass
            if 'element_handles' in locals() and element_handles:
                del element_handles
        except PlaywrightTimeoutError as e_timeout_loc:
            print(f"[sync_browser - DOMProcessor] 요소 핸들 로케이팅 중 타임아웃 발생: {e_timeout_loc}", file=sys.stderr)
        except Exception as e_loc:
            print(f"[sync_browser - DOMProcessor] 요소 핸들 로케이팅 중 오류: {e_loc}", file=sys.stderr)

        print(f"[sync_browser - DOMProcessor] Playwright API 직접 사용 방식: DOM 요소 {len(structured_elements_data)}개 정보 추출 완료.", file=sys.stderr)
        return structured_elements_data

def get_page_analysis(url: str, capture_screenshot: bool = True, build_dom_tree_script_path: str = None):
    print(f"[sync_browser] Playwright 동기 모드로 '{url}' 분석 시작...", file=sys.stderr)
    print(f"[sync_browser] 스크린샷 캡처: {'활성화' if capture_screenshot else '비활성화'}", file=sys.stderr)
    if build_dom_tree_script_path:
        print(f"[sync_browser] buildDomTree.js 경로: {build_dom_tree_script_path}", file=sys.stderr)

    screenshot_data_b64 = None
    dom_structure_list = []
    error_message = None
    playwright_instance = None
    browser = None
    page_instance = None

    try:
        playwright_instance = sync_playwright().start()
        print("[sync_browser] Playwright 시작됨. 브라우저 실행 중...", file=sys.stderr)
        
        browser_to_launch = playwright_instance.chromium # 기본값
        browser_name_to_launch = "Chromium"
        try:
            browser = browser_to_launch.launch(headless=True, args=['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage'])
            print(f"[sync_browser] {browser_name_to_launch} 브라우저 실행됨.", file=sys.stderr)
        except Exception as e_chromium:
            print(f"[sync_browser] {browser_name_to_launch} 브라우저 실행 실패: {e_chromium}", file=sys.stderr)
            print("[sync_browser] Firefox로 재시도 중...", file=sys.stderr)
            try:
                browser_to_launch = playwright_instance.firefox
                browser_name_to_launch = "Firefox"
                browser = browser_to_launch.launch(headless=True) # Firefox는 args가 다를 수 있음
                print(f"[sync_browser] {browser_name_to_launch} 브라우저 실행됨.", file=sys.stderr)
            except Exception as e_firefox:
                print(f"[sync_browser] {browser_name_to_launch} 브라우저 실행 실패: {e_firefox}", file=sys.stderr)
                raise Exception(f"모든 브라우저 ({browser_name_to_launch} 포함) 실행에 실패했습니다.")
        
        print(f"[sync_browser] 새 페이지 생성 중...", file=sys.stderr)
        page_instance = browser.new_page()
        page_instance.set_viewport_size({"width": 1920, "height": 1080})

        print(f"[sync_browser] '{url}'로 이동 중...", file=sys.stderr)
        page_instance.goto(url, wait_until="networkidle", timeout=60000)
        print(f"[sync_browser] '{url}' 로드 완료 (networkidle).", file=sys.stderr)

        if capture_screenshot:
            print("[sync_browser] 스크린샷 캡처 중...", file=sys.stderr)
            try:
                screenshot_bytes = page_instance.screenshot(full_page=True, timeout=30000)
                screenshot_data_b64 = base64.b64encode(screenshot_bytes).decode('utf-8')
                print(f"[sync_browser] 스크린샷 캡처 완료 (Base64 크기: 약 {len(screenshot_data_b64) / 1024:.1f} KB).", file=sys.stderr)
            except PlaywrightTimeoutError as e_timeout_ss:
                print(f"[sync_browser] 전체 페이지 스크린샷 타임아웃: {e_timeout_ss}. 보이는 부분만 캡처 시도...", file=sys.stderr)
                try:
                    screenshot_bytes = page_instance.screenshot(timeout=15000)
                    screenshot_data_b64 = base64.b64encode(screenshot_bytes).decode('utf-8')
                    print(f"[sync_browser] 보이는 부분 스크린샷 캡처 완료.", file=sys.stderr)
                except Exception as e_visible_ss:
                    print(f"[sync_browser] 보이는 부분 스크린샷도 실패: {e_visible_ss}", file=sys.stderr)
                    current_error = f"스크린샷 캡처 실패: {_sanitize_string_for_utf8(str(e_visible_ss))}"
                    error_message = f"{error_message}; {current_error}" if error_message else current_error
            except Exception as e_screenshot:
                print(f"[sync_browser] 스크린샷 캡처 중 오류: {e_screenshot}", file=sys.stderr)
                current_error = f"스크린샷 캡처 오류: {_sanitize_string_for_utf8(str(e_screenshot))}"
                error_message = f"{error_message}; {current_error}" if error_message else current_error

        print("[sync_browser] DOM 정보 처리 중...", file=sys.stderr)
        processor = DOMProcessor(page_instance, build_dom_tree_script_path)
        dom_elements = processor.get_structured_dom_info()
        dom_structure_list = dom_elements
        print(f"[sync_browser] DOM 정보 처리 완료. 추출된 유효 요소 수: {len(dom_structure_list)}", file=sys.stderr)
        
    except PlaywrightTimeoutError as e_timeout:
        print(f"[sync_browser] Playwright 처리 중 타임아웃 발생: {type(e_timeout).__name__}: {e_timeout}", file=sys.stderr)
        traceback.print_exc(file=sys.stderr)
        current_error = f"Playwright 타임아웃: {_sanitize_string_for_utf8(str(e_timeout))}"
        error_message = f"{error_message}; {current_error}" if error_message else current_error
    except Exception as e:
        print(f"[sync_browser] 처리 중 예기치 않은 오류 발생: {type(e).__name__}: {e}", file=sys.stderr)
        traceback.print_exc(file=sys.stderr)
        current_error = f"{type(e).__name__}: {_sanitize_string_for_utf8(str(e))}"
        error_message = f"{error_message}; {current_error}" if error_message else current_error
    finally:
        if page_instance:
            try: page_instance.close()
            except Exception as e: print(f"[sync_browser] 페이지 닫기 오류: {e}", file=sys.stderr)
        if browser:
            try: browser.close()
            except Exception as e: print(f"[sync_browser] 브라우저 닫기 오류: {e}", file=sys.stderr)
        if playwright_instance:
            try: playwright_instance.stop()
            except Exception as e: print(f"[sync_browser] Playwright 중지 오류: {e}", file=sys.stderr)
        print("[sync_browser] 리소스 정리 완료.", file=sys.stderr)

    result = {
        "success": error_message is None,
        "screenshot": screenshot_data_b64,
        "dom_info": dom_structure_list, 
        "error": error_message, # error_message는 이미 sanitize 되었음
    }
    
    success_status = result['success']
    screenshot_size_kb = len(result['screenshot'] or '') / 1024 if result['screenshot'] else 0
    num_dom_elements = len(result['dom_info'])
    error_msg_summary = result['error'] if result['error'] else "없음"
    
    print(f"[sync_browser] 최종 결과 요약: 성공={success_status}, 스크린샷 크기={screenshot_size_kb:.1f}KB, DOM 요소 수={num_dom_elements}, 오류='{error_msg_summary}'", file=sys.stderr)
    return result

if __name__ == "__main__":
    if len(sys.argv) < 2:
        error_result = {
            "success": False, "screenshot": None, "dom_info": [],
            "error": "URL이 제공되지 않았습니다. 사용법: python sync_browser.py <URL> [capture_screenshot_true_false] [build_dom_tree_script_path]"
        }
        sys.stdout.buffer.write(json.dumps(error_result, ensure_ascii=False).encode('utf-8'))
        sys.stdout.flush()
        sys.exit(1)

    target_url = sys.argv[1]
    capture_opt_str = sys.argv[2] if len(sys.argv) > 2 else 'true'
    capture_opt = capture_opt_str.lower() == 'true'
    
    build_dom_tree_path_arg = None
    if len(sys.argv) > 3:
        build_dom_tree_path_arg = sys.argv[3]
        if not os.path.exists(build_dom_tree_path_arg):
            print(f"[sync_browser_main] 경고: 제공된 buildDomTree.js 경로를 찾을 수 없습니다: {build_dom_tree_path_arg}", file=sys.stderr)
    
    print(f"[sync_browser_main] URL: {target_url}, 스크린샷: {capture_opt}, buildDomTree.js 경로: {build_dom_tree_path_arg}", file=sys.stderr)

    analysis_result = get_page_analysis(target_url, 
                                        capture_screenshot=capture_opt, 
                                        build_dom_tree_script_path=build_dom_tree_path_arg)
    
    try:
        output_json = json.dumps(analysis_result, ensure_ascii=False)
        sys.stdout.buffer.write(output_json.encode('utf-8'))
        sys.stdout.flush()
    except Exception as e_json_dump:
        print(f"[sync_browser_main] 최종 결과 JSON 직렬화 실패: {e_json_dump}", file=sys.stderr)
        fallback_error_dict = {
            "success": False, "screenshot": None, "dom_info": [],
            "error": f"결과 JSON 직렬화 실패: {_sanitize_string_for_utf8(str(e_json_dump))}. 원본 오류 메시지: {_sanitize_string_for_utf8(analysis_result.get('error', '알 수 없음'))}"
        }
        try:
            sys.stdout.buffer.write(json.dumps(fallback_error_dict, ensure_ascii=False).encode('utf-8'))
            sys.stdout.flush()
        except Exception as e_fallback_dump:
            critical_error_msg = f"CRITICAL: Fallback JSON dump also failed: {_sanitize_string_for_utf8(str(e_fallback_dump))}\nOriginal Error: {fallback_error_dict['error']}\n"
            sys.stderr.write(critical_error_msg)
            sys.stderr.flush()
