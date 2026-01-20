"""
PyTorch GAN-Based Handwriting Synthesis - Minimal Working Version
==================================================================
"""

import os
import io
import base64
from pathlib import Path
from datetime import datetime, timedelta
from typing import Optional, Tuple, List, Dict, Any
import asyncio
import numpy as np
from PIL import Image, ImageDraw, ImageFont
import random

from app.utils.timezone import get_ph_now, format_ph_datetime

# Try to import PyTorch
try:
    import torch
    import torch.nn as nn
    PYTORCH_AVAILABLE = True
except ImportError:
    PYTORCH_AVAILABLE = False
    print("[WARN] PyTorch not available, using fallback handwriting generator")


class HandwritingGAN:
    """Handwriting generation service with fallback to PIL-based rendering."""
    
    def __init__(self, use_fallback: bool = False):
        self.use_fallback = use_fallback or not PYTORCH_AVAILABLE
        self.model = None
        self._datefont_cache: Dict[int, Dict[str, Image.Image]] = {}
        
    async def load_model(self):
        """Load the handwriting generation model."""
        if self.use_fallback:
            print("[INFO] Using fallback handwriting renderer (PIL-based)")
            return True
        
        try:
            if PYTORCH_AVAILABLE:
                # In production, load actual PyTorch model here
                print("[INFO] PyTorch available but using fallback for now")
                self.use_fallback = True
                return True
        except Exception as e:
            print(f"[WARN] Model loading failed, using fallback: {e}")
            self.use_fallback = True
            return False
    
    async def generate_date(
        self,
        date: Optional[datetime] = None,
        style: str = "Natural Cursive",
        format_type: str = "full",
        width: int = 300,
        height: int = 80,
        format_string: Optional[str] = None,
        font_path: Optional[str] = None,
        font_size: int = 28,
        align_bottom: bool = False,
        bottom_margin_px: int = 4,
        jitter_rotate_deg: float = 0.0,
        jitter_translate_px: int = 0,
        jitter_scale_range: float = 0.0,
        jitter_shear_range: float = 0.0
    ) -> Dict[str, Any]:
        """Generate a handwritten date image."""
        if date is None:
            date = get_ph_now()

        # Format date string
        if format_string:
            date_str = self._format_custom_date(date, format_string)
        elif format_type == "full":
            date_str = date.strftime("%B %d, %Y")
        elif format_type == "short":
            date_str = date.strftime("%m/%d/%Y")
        else:
            date_str = date.strftime("%Y-%m-%d")
        
        # Create base image
        img = Image.new('RGBA', (width, height), (255, 255, 255, 255))
        text_layer = Image.new('RGBA', (width, height), (255, 255, 255, 0))
        draw = ImageDraw.Draw(text_layer)
        
        try:
            if font_path and os.path.exists(font_path):
                font = ImageFont.truetype(font_path, font_size)
            else:
                font = ImageFont.truetype("arial.ttf", font_size)
        except:
            font = ImageFont.load_default()
        
        # Draw text
        bbox = draw.textbbox((0, 0), date_str, font=font)
        text_width = bbox[2] - bbox[0]
        text_height = bbox[3] - bbox[1]
        x = (width - text_width) // 2
        if align_bottom:
            y = height - text_height - bottom_margin_px
        else:
            y = (height - text_height) // 2
        y = max(0, min(y, height - text_height))
        
        draw.text((x, y), date_str, fill='black', font=font)

        # Apply jitter transforms to introduce controlled diversity
        if jitter_scale_range:
            scale = 1.0 + random.uniform(-jitter_scale_range, jitter_scale_range)
            new_w = max(1, int(round(width * scale)))
            new_h = max(1, int(round(height * scale)))
            text_layer = text_layer.resize((new_w, new_h), Image.Resampling.LANCZOS)

        if jitter_shear_range:
            shear = random.uniform(-jitter_shear_range, jitter_shear_range)
            text_layer = text_layer.transform(
                text_layer.size,
                Image.AFFINE,
                (1, shear, 0, 0, 1, 0),
                resample=Image.BICUBIC,
                fillcolor=(255, 255, 255, 0)
            )

        if jitter_rotate_deg:
            angle = random.uniform(-jitter_rotate_deg, jitter_rotate_deg)
            text_layer = text_layer.rotate(
                angle,
                expand=True,
                resample=Image.BICUBIC,
                fillcolor=(255, 255, 255, 0)
            )

        offset_x = random.randint(-jitter_translate_px, jitter_translate_px) if jitter_translate_px else 0
        offset_y = random.randint(-jitter_translate_px, jitter_translate_px) if jitter_translate_px else 0
        paste_x = (width - text_layer.width) // 2 + offset_x
        paste_y = (height - text_layer.height) // 2 + offset_y
        paste_x = max(0, min(paste_x, width - text_layer.width))
        paste_y = max(0, min(paste_y, height - text_layer.height))
        img.paste(text_layer, (paste_x, paste_y), text_layer)
        
        # Convert to bytes
        img_bytes = io.BytesIO()
        img.convert("RGB").save(img_bytes, format='PNG')
        img_bytes.seek(0)
        
        # Convert to base64
        img_base64 = base64.b64encode(img_bytes.getvalue()).decode('utf-8')
        
        return {
            "success": True,
            "image_base64": img_base64,
            "image_bytes": img_bytes.getvalue(),
            "date_string": date_str
        }

    def _format_custom_date(self, date_value: datetime, format_string: str) -> str:
        token_map = {
            "YYYY": f"{date_value.year:04d}",
            "YY": f"{date_value.year % 100:02d}",
            "MM": f"{date_value.month:02d}",
            "M": f"{date_value.month}",
            "DD": f"{date_value.day:02d}",
            "D": f"{date_value.day}",
        }
        output = format_string
        for token in sorted(token_map.keys(), key=len, reverse=True):
            output = output.replace(token, token_map[token])
        return output

    def _get_datefont_dir(self) -> Path:
        project_root = Path(__file__).resolve().parents[3]
        return project_root / "sign" / "datefont"

    def _create_dot_image(self, size: int = 8) -> Image.Image:
        dot_img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
        draw = ImageDraw.Draw(dot_img)
        draw.ellipse([0, 0, size - 1, size - 1], fill=(0, 0, 0, 255))
        return dot_img

    def _load_custom_datefont_images(self, target_height: int) -> Dict[str, Image.Image]:
        if target_height in self._datefont_cache:
            return self._datefont_cache[target_height]

        font_images: Dict[str, Image.Image] = {}
        font_folder = self._get_datefont_dir()
        if not font_folder.exists():
            self._datefont_cache[target_height] = font_images
            return font_images

        for digit in range(10):
            for ext in [".png", ".PNG"]:
                img_path = font_folder / f"{digit}{ext}"
                if not img_path.exists():
                    continue
                try:
                    img = Image.open(img_path).convert("RGBA")
                except Exception:
                    continue
                if img.height != target_height:
                    aspect_ratio = img.width / img.height
                    new_width = max(1, int(round(target_height * aspect_ratio)))
                    img = img.resize((new_width, target_height), Image.Resampling.LANCZOS)
                font_images[str(digit)] = img
                break

        for ext in [".png", ".PNG"]:
            dot_path = font_folder / f"dot{ext}"
            if dot_path.exists():
                try:
                    img = Image.open(dot_path).convert("RGBA")
                except Exception:
                    continue
                if img.height != target_height:
                    aspect_ratio = img.width / img.height
                    new_width = max(1, int(round(target_height * aspect_ratio)))
                    img = img.resize((new_width, target_height), Image.Resampling.LANCZOS)
                font_images["."] = img
                break

        self._datefont_cache[target_height] = font_images
        return font_images

    def _render_date_with_custom_font(
        self,
        date_str: str,
        font_images: Dict[str, Image.Image],
        spacing: int = 2
    ) -> Image.Image:
        if not font_images:
            raise ValueError("Custom date font images are not loaded.")

        total_width = 0
        max_height = 0
        for char in date_str:
            if char == " ":
                total_width += spacing * 3
                continue
            if char not in font_images:
                if char == ".":
                    font_images["."] = font_images.get(".") or self._create_dot_image()
                else:
                    continue
            img = font_images[char]
            total_width += img.width
            max_height = max(max_height, img.height)

        padding = 8
        text_img = Image.new(
            "RGBA",
            (max(1, total_width + padding * 2), max(1, max_height + padding * 2)),
            (0, 0, 0, 0)
        )

        x_offset = padding
        for char in date_str:
            if char == " ":
                x_offset += spacing * 3
                continue
            if char not in font_images:
                if char == ".":
                    font_images["."] = font_images.get(".") or self._create_dot_image()
                else:
                    continue
            img = font_images[char]
            y_offset = padding + (max_height - img.height) // 2
            text_img.paste(img, (x_offset, y_offset), img)
            x_offset += img.width

        return text_img
    
    async def generate_variations(
        self,
        date: datetime,
        count: int = 5
    ) -> List[Dict[str, Any]]:
        """Generate multiple variations of the same date."""
        variations = []
        for i in range(count):
            result = await self.generate_date(date=date)
            variations.append({
                "variation_id": i + 1,
                "image": result["image_base64"]
            })
        return variations
    
    async def composite_signature_with_date(
        self,
        signature_path: str,
        date: datetime,
        style: str = "Natural Cursive",
        output_width: int = 400,
        output_height: int = 150
    ) -> Dict[str, Any]:
        """Composite signature with generated date."""
        # Load signature
        try:
            sig_img = Image.open(signature_path).convert('RGBA')
        except Exception as e:
            return {"success": False, "error": f"Failed to load signature: {e}"}
        
        # Generate date
        date_result = await self.generate_date(date=date, style=style, width=output_width//2, height=60)
        if not date_result.get("success"):
            return date_result
        
        # Load date image
        date_img = Image.open(io.BytesIO(date_result["image_bytes"])).convert('RGBA')
        
        # Create composite
        composite = Image.new('RGBA', (output_width, output_height), (255, 255, 255, 0))
        
        # Paste signature
        sig_resized = sig_img.resize((output_width, output_height//2), Image.Resampling.LANCZOS)
        composite.paste(sig_resized, (0, 0), sig_resized)
        
        # Paste date below signature
        date_y = output_height//2 + 10
        composite.paste(date_img, (0, date_y), date_img)
        
        # Convert to bytes
        img_bytes = io.BytesIO()
        composite.save(img_bytes, format='PNG')
        img_bytes.seek(0)
        
        img_base64 = base64.b64encode(img_bytes.getvalue()).decode('utf-8')
        
        return {
            "success": True,
            "image_base64": img_base64,
            "image_bytes": img_bytes.getvalue()
        }
    
    async def extract_signature_style(self, signature_path: str) -> Dict[str, Any]:
        """Extract style characteristics from signature."""
        return {
            "success": True,
            "style_vector": [0.5] * 64,
            "style_params": {
                "stroke_width": 2.0,
                "slant_angle": 5.0,
                "spacing": 1.5
            }
        }
    
    async def generate_weekday_dates(
        self,
        signature_path: Optional[str] = None,
        week_offset: int = 0
    ) -> List[Dict[str, Any]]:
        """Generate dates for Monday-Friday of specified week."""
        today = get_ph_now()
        # Get next Monday
        days_until_monday = (7 - today.weekday()) % 7
        if days_until_monday == 0:
            days_until_monday = 7
        monday = today + timedelta(days=days_until_monday + (week_offset * 7))
        
        dates = []
        for i in range(5):  # Monday to Friday
            current_date = monday + timedelta(days=i)
            result = await self.generate_date(date=current_date)
            dates.append({
                "date": current_date.isoformat(),
                "day_name": current_date.strftime("%A"),
                "image": result["image_base64"]
            })
        
        return dates
    
    async def composite_signature_with_custom_date(
        self,
        signature_path: str,
        date: datetime,
        output_width: int = 400,
        output_height: int = 150,
        format_string: str = "M.D.YY",
        date_font_height: int = 42
    ) -> Dict[str, Any]:
        """Create composite with custom date font images (M.D.YY)."""
        try:
            sig_img = Image.open(signature_path).convert("RGBA")
        except Exception as e:
            return {"success": False, "error": f"Failed to load signature: {e}"}

        date_str = self._format_custom_date(date, format_string)
        font_images = self._load_custom_datefont_images(date_font_height)
        date_img: Optional[Image.Image] = None

        if font_images:
            try:
                date_img = self._render_date_with_custom_font(date_str, font_images)
            except Exception:
                date_img = None

        if date_img is None:
            date_result = await self.generate_date(
                date=date,
                format_string=format_string,
                width=output_width,
                height=max(60, date_font_height * 2),
                align_bottom=True,
                bottom_margin_px=4
            )
            if not date_result.get("success"):
                return date_result
            date_img = Image.open(io.BytesIO(date_result["image_bytes"])).convert("RGBA")

        if date_img.width > output_width:
            scale = output_width / max(1, date_img.width)
            new_h = max(1, int(round(date_img.height * scale)))
            date_img = date_img.resize((output_width, new_h), Image.Resampling.LANCZOS)

        margin = 4
        sig_height = max(1, output_height - date_img.height - margin)
        sig_resized = sig_img.resize((output_width, sig_height), Image.Resampling.LANCZOS)

        composite = Image.new("RGBA", (output_width, output_height), (255, 255, 255, 0))
        composite.paste(sig_resized, (0, 0), sig_resized)

        date_x = max(0, (output_width - date_img.width) // 2)
        date_y = sig_height + margin
        if date_y + date_img.height > output_height:
            date_y = max(0, output_height - date_img.height)
        composite.paste(date_img, (date_x, date_y), date_img)

        img_bytes = io.BytesIO()
        composite.save(img_bytes, format="PNG")
        img_bytes.seek(0)

        return {
            "success": True,
            "image_base64": base64.b64encode(img_bytes.getvalue()).decode("utf-8"),
            "image_bytes": img_bytes.getvalue(),
            "date_string": date_str,
            "metadata": {"date_string": date_str}
        }


# For compatibility
class CustomFontRenderer:
    """Placeholder for custom font rendering."""
    def __init__(self):
        self.font_images = {}


# Create default instance for compatibility
handwriting_gan = HandwritingGAN()

