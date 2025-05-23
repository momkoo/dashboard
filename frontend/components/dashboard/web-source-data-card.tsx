// 웹소스별 데이터를 감싸는 카드
export function WebSourceDataCard({ source, children }) {
    return (
      <Card>
        <CardHeader>
          <div className="flex justify-between">
            <CardTitle>{source.name}</CardTitle>
            <div className="space-x-2">
              <Button variant="outline" size="sm">자세히</Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => router.push('/dashboard')}
              >
                관리
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {children}
        </CardContent>
      </Card>
    )
  }