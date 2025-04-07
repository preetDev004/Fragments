# Test Conversions between different fragment formats

# Test 1: Create a markdown fragment and convert to HTML
POST http://localhost:8080/v1/fragments
Content-Type: text/markdown
[BasicAuth]
user1@email.com:password1
`# Hello World`

# 1. We expect to get back an HTTP 201
HTTP/1.1 201
# We have various assertions about the response that we want to check
[Asserts]
# The Location header should look like what we expect (including the fragment id)
header "Location" matches "^http:\/\/localhost:8080\/v1\/fragments\/[A-Za-z0-9_-]+$"
jsonpath "$.status" == "ok"
# Our fragment ids use UUIDs
jsonpath "$.fragment.id" matches "^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$"
jsonpath "$.fragment.type" == "text/markdown"
[Captures]
fragment_id: jsonpath "$.fragment.id"

# Get the fragment as HTML
GET http://localhost:8080/v1/fragments/{{fragment_id}}.html
[BasicAuth]
user1@email.com:password1

HTTP/1.1 200
[Asserts]
header "Content-Type" startsWith "text/html"
body contains "<h1>Hello World</h1>"

# Test 2: Create a CSV fragment and convert to JSON
POST http://localhost:8080/v1/fragments
Content-Type: text/csv
[BasicAuth]
user1@email.com:password1
```
name,age,city
John,30,New York
Jane,25,Boston
```

HTTP/1.1 201
[Asserts]
jsonpath "$.status" == "ok"
jsonpath "$.fragment.type" == "text/csv"
[Captures]
csv_fragment_id: jsonpath "$.fragment.id"

# Get the fragment as JSON
GET http://localhost:8080/v1/fragments/{{csv_fragment_id}}.json
[BasicAuth]
user1@email.com:password1

HTTP/1.1 200
[Asserts]
header "Content-Type" startsWith "application/json"
jsonpath "$[0].name" == "John"
jsonpath "$[0].age" == "30"
jsonpath "$[0].city" == "New York" 
jsonpath "$[1].name" == "Jane"
jsonpath "$[1].age" == "25"
jsonpath "$[1].city" == "Boston"

# Test 3: Create a JSON fragment and convert to YAML
POST http://localhost:8080/v1/fragments
Content-Type: application/json
[BasicAuth]
user1@email.com:password1
`{"name": "John", "age": 30, "city": "New York"}`

HTTP/1.1 201
[Asserts]
jsonpath "$.status" == "ok"
jsonpath "$.fragment.type" == "application/json"
[Captures]
json_fragment_id: jsonpath "$.fragment.id"

# Get the fragment as YAML
GET http://localhost:8080/v1/fragments/{{json_fragment_id}}.yaml
[BasicAuth]
user1@email.com:password1

HTTP/1.1 200
[Asserts]
header "Content-Type" startsWith "text/yaml"
body contains "name: John"
body contains "age: 30"
body contains "city: New York"

# Test 4: Create an HTML fragment and convert to plain text
POST http://localhost:8080/v1/fragments
Content-Type: text/html
[BasicAuth]
user1@email.com:password1
`<h1>Hello World</h1><p>This is a <strong>test</strong>.</p>`

HTTP/1.1 201
[Asserts]
jsonpath "$.status" == "ok"
jsonpath "$.fragment.type" == "text/html"
[Captures]
html_fragment_id: jsonpath "$.fragment.id"

# Get the fragment as plain text
GET http://localhost:8080/v1/fragments/{{html_fragment_id}}.txt
[BasicAuth]
user1@email.com:password1

HTTP/1.1 200
[Asserts]
header "Content-Type" startsWith "text/plain"
body contains "Hello World"
body not contains "<h1>"

# Test 5: Try invalid conversion (plain text to HTML - not supported)
POST http://localhost:8080/v1/fragments
Content-Type: text/plain
[BasicAuth]
user1@email.com:password1
`This is plain text that cannot be converted to HTML`

HTTP/1.1 201
[Asserts]
jsonpath "$.status" == "ok"
jsonpath "$.fragment.type" == "text/plain"
[Captures]
plain_fragment_id: jsonpath "$.fragment.id"

# Try to convert plain text to HTML (should fail)
GET http://localhost:8080/v1/fragments/{{plain_fragment_id}}.html
[BasicAuth]
user1@email.com:password1

HTTP/1.1 400
[Asserts]
jsonpath "$.status" == "error"
jsonpath "$.error.message" contains "Conversion not possible"

# Test 6: Try accessing a non-existent fragment for conversion
GET http://localhost:8080/v1/fragments/non-existent-id.html
[BasicAuth]
user1@email.com:password1

HTTP/1.1 404
[Asserts]
jsonpath "$.status" == "error"

# Test 7: Try accessing another user's fragment
# First create a fragment with user1
POST http://localhost:8080/v1/fragments
Content-Type: text/markdown
[BasicAuth]
user1@email.com:password1
`# Private Content`

HTTP/1.1 201
[Asserts]
jsonpath "$.status" == "ok"
[Captures]
private_fragment_id: jsonpath "$.fragment.id"

# Try to access it as user2
GET http://localhost:8080/v1/fragments/{{private_fragment_id}}.html
[BasicAuth]
user2@email.com:password2

HTTP/1.1 404
[Asserts]
jsonpath "$.status" == "error"

# Test 8: Try accessing conversion as unauthenticated user
GET http://localhost:8080/v1/fragments/{{fragment_id}}.html

HTTP/1.1 401
[Asserts]
jsonpath "$.status" == "error"
