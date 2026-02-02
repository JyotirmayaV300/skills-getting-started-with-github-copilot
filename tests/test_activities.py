from fastapi.testclient import TestClient
from app import app, activities

client = TestClient(app)

TEST_EMAIL = "test.user@example.com"


def setup_function():
    # Ensure a clean state before each test
    for a in activities.values():
        if TEST_EMAIL in a["participants"]:
            a["participants"].remove(TEST_EMAIL)


def test_signup_updates_participants():
    activity = "Chess Club"
    email = TEST_EMAIL

    # Ensure not present
    if email in activities[activity]["participants"]:
        activities[activity]["participants"].remove(email)

    r = client.post(f"/activities/{activity}/signup?email={email}")
    assert r.status_code == 200
    data = client.get("/activities").json()
    assert email in data[activity]["participants"]


def test_duplicate_signup_returns_400():
    activity = "Chess Club"
    email = TEST_EMAIL

    # Ensure signed up
    if email not in activities[activity]["participants"]:
        client.post(f"/activities/{activity}/signup?email={email}")

    r = client.post(f"/activities/{activity}/signup?email={email}")
    assert r.status_code == 400


def test_unregister_updates_participants():
    activity = "Chess Club"
    email = TEST_EMAIL

    # Ensure signed up
    if email not in activities[activity]["participants"]:
        client.post(f"/activities/{activity}/signup?email={email}")

    r = client.post(f"/activities/{activity}/unregister?email={email}")
    assert r.status_code == 200

    data = client.get("/activities").json()
    assert email not in data[activity]["participants"]


def test_unregister_nonexistent_returns_400():
    activity = "Chess Club"
    email = "nonexistent@example.com"

    # Ensure not present
    if email in activities[activity]["participants"]:
        activities[activity]["participants"].remove(email)

    r = client.post(f"/activities/{activity}/unregister?email={email}")
    assert r.status_code == 400
