# Test for updating a fragment

# Step 1: POST a new text fragment
POST http://localhost:8080/v1/fragments
Content-Type: text/plain
[BasicAuth]
user1@email.com:password1
`Original fragment content`

# Confirm server returns 201 and capture fragment ID
HTTP/1.1 201
[Asserts]
jsonpath "$.status" == "ok"
jsonpath "$.fragment.type" == "text/plain"
jsonpath "$.fragment.size" == 25
[Captures]
fragment_id: jsonpath "$.fragment.id"

# Step 2: PUT to update the fragment
PUT http://localhost:8080/v1/fragments/{{fragment_id}}
Content-Type: text/plain
[BasicAuth]
user1@email.com:password1
`Updated fragment content`

# Confirm server returns 200
HTTP/1.1 200
[Asserts]
jsonpath "$.status" == "ok"
jsonpath "$.fragment.id" == "{{fragment_id}}"
jsonpath "$.fragment.type" == "text/plain"
jsonpath "$.fragment.size" == 24

# Step 3: GET the updated fragment
GET http://localhost:8080/v1/fragments/{{fragment_id}}
[BasicAuth]
user1@email.com:password1

# Confirm server returns 200 and updated content
HTTP/1.1 200
Content-Type: text/plain
[Asserts]
body == "Updated fragment content"

# Step 4: Test error case - try to update with wrong content type
PUT http://localhost:8080/v1/fragments/{{fragment_id}}
Content-Type: application/json
[BasicAuth]
user1@email.com:password1
`{"key": "value"}`

# Confirm server returns 400
HTTP/1.1 400
[Asserts]
jsonpath "$.status" == "error"
jsonpath "$.error.message" contains "Cannot update fragment with different MIME type"

# Step 5: Test with non-existent fragment
PUT http://localhost:8080/v1/fragments/non-existent-id
Content-Type: text/plain
[BasicAuth]
user1@email.com:password1
`This should fail`

# Confirm server returns 404
HTTP/1.1 404
[Asserts]
jsonpath "$.status" == "error"
jsonpath "$.error.code" == 404
