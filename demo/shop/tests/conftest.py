import pytest


class FakeResp:
    def __init__(self, rate):
        self._rate = rate

    def raise_for_status(self):
        pass

    def json(self):
        return {"rate": self._rate}


class FakeSession:
    def __init__(self, rate=0.1):
        self.rate, self.calls = rate, []

    def get(self, url, params=None, timeout=None):
        self.calls.append((url, params))
        return FakeResp(self.rate)


@pytest.fixture
def session():
    return FakeSession()
