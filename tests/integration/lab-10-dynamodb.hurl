# Step 1: POST a new JSON fragment
POST http://localhost:8080/v1/fragments
Content-Type: application/json
[BasicAuth]
user1@email.com:password1
`{"service":"DynamoDB"}`

# Confirm server returns 201 and capture Location header and fragment ID
HTTP/1.1 201
[Asserts]
jsonpath "$.status" == "ok"
jsonpath "$.fragment.type" == "application/json"
jsonpath "$.fragment.size" == 22
header "Location" matches "^http:\/\/localhost:8080\/v1\/fragments\/[A-Za-z0-9_-]+$"
[Captures]
fragment1_url: header "Location"
fragment1_id: jsonpath "$.fragment.id"


# Step 2: GET the fragment info for the first fragment
GET {{fragment1_url}}/info
[BasicAuth]
user1@email.com:password1

# Confirm server returns 200 and metadata matches
HTTP/1.1 200
[Asserts]
jsonpath "$.status" == "ok"
jsonpath "$.fragment.id" == "{{fragment1_id}}"
jsonpath "$.fragment.ownerId" isString
jsonpath "$.fragment.type" == "application/json"
jsonpath "$.fragment.size" == 22

# Step 3: POST a second Markdown fragment
POST http://localhost:8080/v1/fragments
Content-Type: text/markdown
[BasicAuth]
user1@email.com:password1
`DynamoDB is **great**.`

# Confirm server returns 201 and capture Location header and fragment ID
HTTP/1.1 201
[Asserts]
jsonpath "$.status" == "ok"
jsonpath "$.fragment.type" == "text/markdown"
jsonpath "$.fragment.size" == 22
header "Location" matches "^http:\/\/localhost:8080\/v1\/fragments\/[A-Za-z0-9_-]+$"
[Captures]
fragment2_url: header "Location"
fragment2_id: jsonpath "$.fragment.id"

# Step 4: GET the fragment info for the second fragment
GET {{fragment2_url}}/info
[BasicAuth]
user1@email.com:password1

# Confirm server returns 200 and metadata matches
HTTP/1.1 200
[Asserts]
jsonpath "$.status" == "ok"
jsonpath "$.fragment.id" == "{{fragment2_id}}"
jsonpath "$.fragment.type" == "text/markdown"
jsonpath "$.fragment.size" == 22

# Step 5: GET all fragments for the user (IDs only)
GET http://localhost:8080/v1/fragments
[BasicAuth]
user1@email.com:password1

# Confirm server returns 200 and includes both fragment IDs
HTTP/1.1 200
[Asserts]
jsonpath "$.status" == "ok"
jsonpath "$.fragments" contains "{{fragment1_id}}"
jsonpath "$.fragments" contains "{{fragment2_id}}"

# Step 6: DELETE the first fragment
DELETE {{fragment1_url}}
[BasicAuth]
user1@email.com:password1

# Confirm server returns 200
HTTP/1.1 200
[Asserts]
jsonpath "$.status" == "ok"

# Step 7: Try to GET the deleted fragment
GET {{fragment1_url}}/info
[BasicAuth]
user1@email.com:password1

# Confirm server returns 404
HTTP/1.1 404
[Asserts]
jsonpath "$.status" == "error"
jsonpath "$.error.code" == 404

# Step 8: GET all fragments for the user again (IDs only)
GET http://localhost:8080/v1/fragments
[BasicAuth]
user1@email.com:password1

# Confirm server returns 200 and only includes the second fragment ID
HTTP/1.1 200
[Asserts]
jsonpath "$.status" == "ok"
jsonpath "$.fragments" not contains "{{fragment1_id}}"
jsonpath "$.fragments" contains "{{fragment2_id}}"
