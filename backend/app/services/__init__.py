"""Services package initialization."""

from __future__ import annotations

import logging

from .lark_bot_service import LarkBotService, lark_bot_service

logger = logging.getLogger(__name__)

try:
	from .handwriting_gan import HandwritingGAN, handwriting_gan
except Exception as exc:
	HandwritingGAN = None
	handwriting_gan = None
	logger.warning("HandwritingGAN unavailable: %s", exc)
