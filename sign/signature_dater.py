from PIL import Image, ImageDraw, ImageFont
from datetime import datetime, timedelta, timezone
import os
import random

# Philippines timezone (UTC+8)
PH_TIMEZONE = timezone(timedelta(hours=8))

def get_week_dates():
    """Get the 5 weekdays (Monday-Friday) starting from today in PH timezone"""
    today = datetime.now(PH_TIMEZONE)
    # Find Monday of current week
    days_since_monday = today.weekday()  # 0 = Monday, 6 = Sunday
    monday = today - timedelta(days=days_since_monday)
    
    # Generate 5 dates (Monday to Friday)
    week_dates = []
    for i in range(5):
        date = monday + timedelta(days=i)
        week_dates.append(date)
    
    return week_dates

def format_date(date):
    """Format date as M.D.YY"""
    month = date.month
    day = date.day
    year = date.year % 100  # Get last 2 digits of year
    
    return f"{month}.{day}.{year}"

def load_custom_font_images(font_folder="datefont", target_height=42):
    """Load custom font images (0-9) from the datefont folder"""
    font_images = {}
    font_folder_path = font_folder
    
    if not os.path.exists(font_folder_path):
        print(f"Warning: Font folder '{font_folder_path}' not found!")
        return font_images
    
    # Load images for digits 0-9
    for digit in range(10):
        # Try both lowercase and uppercase extensions
        for ext in ['.png', '.PNG']:
            img_path = os.path.join(font_folder_path, f"{digit}{ext}")
            if os.path.exists(img_path):
                try:
                    img = Image.open(img_path)
                    # Convert to RGBA if not already
                    if img.mode != 'RGBA':
                        img = img.convert('RGBA')
                    
                    # Resize to target height while maintaining aspect ratio
                    if img.height != target_height:
                        aspect_ratio = img.width / img.height
                        new_width = int(target_height * aspect_ratio)
                        img = img.resize((new_width, target_height), Image.Resampling.LANCZOS)
                    
                    font_images[str(digit)] = img
                    break
                except Exception as e:
                    print(f"Warning: Could not load {img_path}: {e}")
                    continue
    
    # Check for dot image
    for ext in ['.png', '.PNG']:
        dot_path = os.path.join(font_folder_path, f"dot{ext}")
        if os.path.exists(dot_path):
            try:
                img = Image.open(dot_path)
                if img.mode != 'RGBA':
                    img = img.convert('RGBA')
                # Resize dot to be proportional to numbers
                if img.height != target_height:
                    aspect_ratio = img.width / img.height
                    new_width = int(target_height * aspect_ratio)
                    img = img.resize((new_width, target_height), Image.Resampling.LANCZOS)
                font_images['.'] = img
                break
            except Exception as e:
                print(f"Warning: Could not load dot image {dot_path}: {e}")
                continue
    
    return font_images

def create_dot_image(size=8, color=(0, 0, 0, 255)):
    """Create a simple dot image if no dot image is found"""
    dot_img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(dot_img)
    # Draw a filled circle
    draw.ellipse([0, 0, size-1, size-1], fill=color)
    return dot_img

def render_date_with_custom_font(date_str, font_images, spacing=2):
    """Render date string using custom font images"""
    if not font_images:
        raise ValueError("No font images loaded!")
    
    # Calculate total width needed
    total_width = 0
    max_height = 0
    char_widths = {}
    
    for char in date_str:
        if char == ' ':
            total_width += spacing * 3  # Space width (adjustable)
        elif char in font_images:
            img = font_images[char]
            char_widths[char] = img.width
            total_width += img.width
            max_height = max(max_height, img.height)
        elif char == '.':
            # Use dot image if available, otherwise create one
            if '.' in font_images:
                img = font_images['.']
            else:
                # Create dot based on average number height if available
                avg_height = max_height if max_height > 0 else 42
                img = create_dot_image(size=max(6, avg_height // 6))
                font_images['.'] = img
            char_widths['.'] = img.width
            total_width += img.width
            max_height = max(max_height, img.height)
    
    # Create image for the date text
    padding = 20
    text_img = Image.new('RGBA', (total_width + padding * 2, max_height + padding * 2), (0, 0, 0, 0))
    
    # Draw each character
    x_offset = padding
    for char in date_str:
        if char == ' ':
            x_offset += spacing * 3  # Add space width
        elif char in font_images:
            img = font_images[char]
            # Center vertically
            y_offset = padding + (max_height - img.height) // 2
            text_img.paste(img, (x_offset, y_offset), img)
            x_offset += img.width
        elif char == '.':
            if '.' in font_images:
                img = font_images['.']
            else:
                avg_height = max_height if max_height > 0 else 42
                img = create_dot_image(size=max(6, avg_height // 6))
                font_images['.'] = img
            y_offset = padding + (max_height - img.height) // 2
            text_img.paste(img, (x_offset, y_offset), img)
            x_offset += img.width
    
    return text_img

def add_date_to_signature(signature_path, date_str, output_path, position=(10, 10)):
    """Add date to signature image using custom font images, centered and slanted"""
    # Open the signature image and ensure it has transparency
    img = Image.open(signature_path)
    
    # Convert to RGBA if not already (to preserve transparency)
    if img.mode != 'RGBA':
        img = img.convert('RGBA')
    
    # Load custom font images
    font_size = 41
    font_images = load_custom_font_images("datefont", target_height=font_size)
    
    if not font_images:
        print(f"Error: No custom font images found in 'datefont' folder!")
        return
    
    # Render date string using custom font images
    text_img = render_date_with_custom_font(date_str, font_images, spacing=2)
    
    # Apply slant/rotation to match signature (slanting to the right)
    # Random slant angle between 0 and 12 degrees (12 is the maximum)
    slant_angle = random.randint(2, 12)  # degrees, positive rotates clockwise (to the right)
    text_img_rotated = text_img.rotate(slant_angle, expand=True, resample=Image.BICUBIC, fillcolor=(0, 0, 0, 0))
    
    # Get dimensions of rotated text
    rotated_width, rotated_height = text_img_rotated.size
    
    # Keep original image size - position date within the signature image bounds
    img_width, img_height = img.size
    
    # Position date at the bottom center of the signature image
    x = (img_width - rotated_width) // 2  # Center horizontally
    y = img_height - rotated_height - 2  # Position date at bottom with small margin
    
    # Add slight random variation to position for more natural handwritten look
    x_offset = random.randint(-2, 2)
    y_offset = random.randint(-1, 1)
    x += x_offset
    y += y_offset
    
    # Ensure date stays within image bounds
    x = max(0, min(x, img_width - rotated_width))
    y = max(0, min(y, img_height - rotated_height))
    
    # Paste the rotated text onto the original image (using the rotated image as mask for transparency)
    img.paste(text_img_rotated, (x, y), text_img_rotated)
    
    # Save the image with transparency preserved (same size as original)
    img.save(output_path, 'PNG', optimize=True)
    print(f"Created: {output_path} with date: {date_str}")

def main():
    # Paths
    assets_folder = "assets"
    signature_path = os.path.join(assets_folder, "testsign.png")
    output_folder = "dated_signatures"
    
    # Create output folder if it doesn't exist
    os.makedirs(output_folder, exist_ok=True)
    
    # Check if signature file exists
    if not os.path.exists(signature_path):
        print(f"Error: Signature file not found at {signature_path}")
        return
    
    # Get dates for the week
    week_dates = get_week_dates()
    
    print("Generating dated signatures for the week...")
    print("-" * 50)
    
    # Generate 5 signatures with dates
    for i, date in enumerate(week_dates, 1):
        date_str = format_date(date)
        day_name = date.strftime("%A")
        output_filename = f"signature_{day_name.lower()}_{date_str.replace('.', '_')}.png"
        output_path = os.path.join(output_folder, output_filename)
        
        add_date_to_signature(signature_path, date_str, output_path)
        print(f"{i}. {day_name} ({date_str})")
    
    print("-" * 50)
    print(f"All 5 signatures generated in '{output_folder}' folder!")

if __name__ == "__main__":
    main()
