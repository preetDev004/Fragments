POST http://localhost:8080/v1/fragments
Content-Type: unknown/type
[BasicAuth]
user1@email.com:password1
`An Unkonwn/Unsupported Fragment Type!`

# 1. We expect to get back an HTTP 415
HTTP/1.1 415
[Asserts]
# We expect to get back a JSON response with { "status": "error", ... }
jsonpath "$.status" == "error"
jsonpath "$.error.code" == 415  
jsonpath "$.error.message" == "Unsupported content type"
