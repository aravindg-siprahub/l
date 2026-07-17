import urllib.request
try:
    req = urllib.request.Request("http://localhost:3000/dashboard/admin/users")
    req.add_header("Cookie", "access_token=test")
    with urllib.request.urlopen(req) as res:
        body = res.read().decode('utf-8')
        print(body[:1000])
except Exception as e:
    print("Error:", e)
