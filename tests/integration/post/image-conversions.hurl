# Test image format conversions

# Test 1: Upload a PNG image and convert it to JPEG
POST http://localhost:8080/v1/fragments
Content-Type: image/png
[BasicAuth]
user1@email.com:password1
base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==;

# We expect to get back an HTTP 201
HTTP/1.1 201
[Asserts]
header "Location" matches "^http:\/\/localhost:8080\/v1\/fragments\/[A-Za-z0-9_-]+$"
jsonpath "$.status" == "ok"
jsonpath "$.fragment.type" == "image/png"
[Captures]
png_fragment_id: jsonpath "$.fragment.id"

# Get the fragment as JPEG
GET http://localhost:8080/v1/fragments/{{png_fragment_id}}.jpeg
[BasicAuth]
user1@email.com:password1

HTTP/1.1 200
[Asserts]
header "Content-Type" == "image/jpeg"

# Test 2: Upload a JPEG image and convert it to WEBP
POST http://localhost:8080/v1/fragments
Content-Type: image/jpeg
[BasicAuth]
user1@email.com:password1
base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAIBAQIBAQICAgICAgICAwUDAwMDAwYEBAMFBwYHBwcGBwcICQsJCAgKCAcHCg0KCgsMDAwMBwkODw0MDgsMDAz/2wBDAQICAgMDAwYDAwYMCAcIDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAz/wAARCAABAAEDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD9/KKKKAP/2Q==;

HTTP/1.1 201
[Asserts]
jsonpath "$.status" == "ok"
jsonpath "$.fragment.type" == "image/jpeg"
[Captures]
jpeg_fragment_id: jsonpath "$.fragment.id"

# Get the fragment as WEBP
GET http://localhost:8080/v1/fragments/{{jpeg_fragment_id}}.webp
[BasicAuth]
user1@email.com:password1

HTTP/1.1 200
[Asserts]
header "Content-Type" == "image/webp"

# Test 3: Convert PNG to GIF
GET http://localhost:8080/v1/fragments/{{png_fragment_id}}.gif
[BasicAuth]
user1@email.com:password1

HTTP/1.1 200
[Asserts]
header "Content-Type" == "image/gif"

# Test 4: Convert JPEG to AVIF
GET http://localhost:8080/v1/fragments/{{jpeg_fragment_id}}.avif
[BasicAuth]
user1@email.com:password1

HTTP/1.1 200
[Asserts]
header "Content-Type" == "image/avif"

# Test 5: Try to convert image to unsupported format
GET http://localhost:8080/v1/fragments/{{png_fragment_id}}.html
[BasicAuth]
user1@email.com:password1

HTTP/1.1 400
[Asserts]
jsonpath "$.status" == "error"
jsonpath "$.error.message" contains "Conversion not possible"

# Test 6: Try accessing another user's image fragment
GET http://localhost:8080/v1/fragments/{{png_fragment_id}}.jpeg
[BasicAuth]
user2@email.com:password2

HTTP/1.1 404
[Asserts]
jsonpath "$.status" == "error"
