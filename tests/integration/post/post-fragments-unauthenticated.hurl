POST http://localhost:8080/v1/fragments
Content-Type: text/plain
`This is a sample fragment!`

# 1. We expect to get back an HTTP 401
HTTP/1.1 401
[Asserts]
# We expect to get back a JSON response with { "status": "error", ... }
jsonpath "$.status" == "error"
jsonpath "$.error.code" == 401
jsonpath "$.error.message" == "Unauthorized"
