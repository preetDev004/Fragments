# Step 1: POST a new text fragment
POST http://localhost:8080/v1/fragments
Content-Type: text/plain
[BasicAuth]
user1@email.com:password1
`Hello S3!`

# Confirm server returns 201 and capture Location header
HTTP/1.1 201
[Asserts]
jsonpath "$.status" == "ok"
jsonpath "$.fragment.type" == "text/plain"
jsonpath "$.fragment.size" == 9
header "Location" matches "^http:\/\/localhost:8080\/v1\/fragments\/[A-Za-z0-9_-]+$"
[Captures]
url: header "Location"

# Step 2: GET the fragment just created
GET {{url}}
[BasicAuth]
user1@email.com:password1

# Confirm server returns 200, correct type and body
HTTP/1.1 200
Content-Type: text/plain
[Asserts]
body == "Hello S3!"

# Step 3: DELETE the fragment
DELETE {{url}}
[BasicAuth]
user1@email.com:password1

# Confirm server returns 200
HTTP/1.1 200
[Asserts]
jsonpath "$.status" == "ok"

# Step 4: Try to GET the deleted fragment
GET {{url}}
[BasicAuth]
user1@email.com:password1

# Confirm server returns 404 since fragment should be deleted
HTTP/1.1 404
[Asserts]
jsonpath "$.status" == "error"
jsonpath "$.error.code" == 404
