import requests

# Create student
res = requests.post("http://127.0.0.1:8000/api/students/", json={"name": "Test User", "roll_no": "12345"})
student = res.json()
print("Student:", student)

# Create session
res = requests.post("http://127.0.0.1:8000/api/sessions/", json={"student_id": student["id"]})
session = res.json()
print("Session:", session)

# Send chat
res = requests.post("http://127.0.0.1:8000/api/chat/", json={"session_id": session["id"], "message": "what is ai?"})
chat_res = res.json()
print("Chat Response:", chat_res)
