import json
import unittest

from app.services.lark_card_update_service import parse_lark_action_value


class TestParseLarkActionValue(unittest.TestCase):
    def test_dict_value(self):
        raw = {"action": "approve", "signature_id": 1}
        parsed = parse_lark_action_value(raw)
        self.assertEqual(parsed.get("action"), "approve")
        self.assertEqual(parsed.get("signature_id"), 1)

    def test_json_string_value(self):
        raw = "{\"action\": \"reject\", \"signature_id\": 2}"
        parsed = parse_lark_action_value(raw)
        self.assertEqual(parsed.get("action"), "reject")
        self.assertEqual(parsed.get("signature_id"), 2)

    def test_double_encoded_value(self):
        raw = json.dumps("{\"action\": \"approve\", \"signature_id\": 3}")
        parsed = parse_lark_action_value(raw)
        self.assertEqual(parsed.get("action"), "approve")
        self.assertEqual(parsed.get("signature_id"), 3)


if __name__ == "__main__":
    unittest.main()
