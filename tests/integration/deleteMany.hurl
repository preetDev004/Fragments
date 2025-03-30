# Test for deleteMany endpoint that deletes multiple fragments at once

# Step 1: POST a first fragment
POST http://localhost:8080/v1/fragments
Content-Type: text/plain
[BasicAuth]
user1@email.com:password1
`This is the first fragment`

# Confirm server returns 201 and capture fragment ID
HTTP/1.1 201
[Asserts]
jsonpath "$.status" == "ok"
jsonpath "$.fragment.type" == "text/plain"
[Captures]
fragment1_id: jsonpath "$.fragment.id"

# Step 2: POST a second fragment
POST http://localhost:8080/v1/fragments
Content-Type: text/plain
[BasicAuth]
user1@email.com:password1
`This is the second fragment`

# Confirm server returns 201 and capture fragment ID
HTTP/1.1 201
[Asserts]
jsonpath "$.status" == "ok"
jsonpath "$.fragment.type" == "text/plain"
[Captures]
fragment2_id: jsonpath "$.fragment.id"

# Step 3: POST a third fragment
POST http://localhost:8080/v1/fragments
Content-Type: text/plain
[BasicAuth]
user1@email.com:password1
`This is the third fragment`

# Confirm server returns 201 and capture fragment ID
HTTP/1.1 201
[Asserts]
jsonpath "$.status" == "ok"
jsonpath "$.fragment.type" == "text/plain"
[Captures]
fragment3_id: jsonpath "$.fragment.id"

# Step 4: GET all fragments to verify we have three fragments
GET http://localhost:8080/v1/fragments
[BasicAuth]
user1@email.com:password1

# Confirm server returns 200 and all fragments exist
HTTP/1.1 200
[Asserts]
jsonpath "$.status" == "ok"
jsonpath "$.fragments" contains "{{fragment1_id}}"
jsonpath "$.fragments" contains "{{fragment2_id}}"
jsonpath "$.fragments" contains "{{fragment3_id}}"

# Step 5: Delete first and third fragment using deleteMany endpoint
DELETE http://localhost:8080/v1/fragments?ids={{fragment1_id}}&ids={{fragment3_id}}
[BasicAuth]
user1@email.com:password1

# Confirm server returns 200
HTTP/1.1 200
[Asserts]
jsonpath "$.status" == "ok"

# Step 6: Try to GET the first deleted fragment
GET http://localhost:8080/v1/fragments/{{fragment1_id}}
[BasicAuth]
user1@email.com:password1

# Confirm server returns 404
HTTP/1.1 404
[Asserts]
jsonpath "$.status" == "error"
jsonpath "$.error.code" == 404

# Step 7: Try to GET the third deleted fragment
GET http://localhost:8080/v1/fragments/{{fragment3_id}}
[BasicAuth]
user1@email.com:password1

# Confirm server returns 404
HTTP/1.1 404
[Asserts]
jsonpath "$.status" == "error"
jsonpath "$.error.code" == 404

# Step 8: GET all fragments again to verify only the second fragment remains
GET http://localhost:8080/v1/fragments
[BasicAuth]
user1@email.com:password1

# Confirm server returns 200 and only the second fragment exists
HTTP/1.1 200
[Asserts]
jsonpath "$.status" == "ok"
jsonpath "$.fragments" not contains "{{fragment1_id}}"
jsonpath "$.fragments" contains "{{fragment2_id}}"
jsonpath "$.fragments" not contains "{{fragment3_id}}"

# Step 9: Test error handling - Try to delete with no fragment IDs provided
DELETE http://localhost:8080/v1/fragments?ids=
[BasicAuth]
user1@email.com:password1

# Confirm server returns 400
HTTP/1.1 400
[Asserts]
jsonpath "$.status" == "error"
jsonpath "$.error.code" == 400
jsonpath "$.error.message" == "No fragment IDs provided"

# Step 10: Test error handling - Try to delete non-existent fragments
DELETE http://localhost:8080/v1/fragments?ids=non-existent-id
[BasicAuth]
user1@email.com:password1

# Confirm server returns error (404 or similar)
HTTP/1.1 404
[Asserts]
jsonpath "$.status" == "error"
