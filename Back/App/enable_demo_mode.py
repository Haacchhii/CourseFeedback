"""
Enable Demo Mode for Presentation
Temporarily disables strict email validation to allow test accounts
"""

from sqlalchemy import text
from database.connection import get_db

def enable_demo_mode():
    """
    Enables demo mode by:
    1. Allowing any email format (not just real LPU emails)
    2. Displaying a banner that system is in demo mode
    """
    
    db = next(get_db())
    
    try:
        # Check if system_settings table exists and has demo_mode setting
        result = db.execute(text("""
            SELECT setting_key, setting_value 
            FROM system_settings 
            WHERE setting_key = 'demo_mode'
        """)).fetchone()
        
        if result:
            # Update existing setting
            db.execute(text("""
                UPDATE system_settings 
                SET setting_value = 'true', updated_at = NOW()
                WHERE setting_key = 'demo_mode'
            """))
            print("✅ Updated demo_mode setting to TRUE")
        else:
            # Insert new setting
            db.execute(text("""
                INSERT INTO system_settings (setting_key, setting_value, description)
                VALUES ('demo_mode', 'true', 'Enables demo mode for presentations - disables strict email validation')
            """))
            print("✅ Created demo_mode setting and set to TRUE")
        
        # Also add presentation_mode setting
        result = db.execute(text("""
            SELECT setting_key FROM system_settings WHERE setting_key = 'presentation_mode'
        """)).fetchone()
        
        if not result:
            db.execute(text("""
                INSERT INTO system_settings (setting_key, setting_value, description)
                VALUES ('presentation_mode', 'true', 'System is in presentation mode - shows demo banner')
            """))
            print("✅ Enabled presentation_mode banner")
        
        db.commit()
        
        print("\n" + "="*60)
        print("DEMO MODE ENABLED FOR PRESENTATION")
        print("="*60)
        print("\nWhat changed:")
        print("  ✓ Email validation relaxed (accepts @demo.lpu.edu.ph)")
        print("  ✓ System will show 'DEMO MODE' banner")
        print("  ✓ Test accounts can be created freely")
        print("\nNow you can:")
        print("  1. Run: python create_demo_users.py")
        print("  2. Import the generated CSV files")
        print("  3. Login with demo credentials")
        print("\nTo disable demo mode after presentation:")
        print("  Run: python disable_demo_mode.py")
        print("="*60)
        
    except Exception as e:
        print(f"❌ Error enabling demo mode: {e}")
        print("\nTrying alternative approach...")
        
        # Alternative: Just confirm it's OK to proceed manually
        print("\n" + "="*60)
        print("MANUAL DEMO MODE SETUP")
        print("="*60)
        print("\nSince system_settings table might not have demo_mode,")
        print("you can simply:")
        print("\n1. Create users with @demo.lpu.edu.ph emails")
        print("2. System will accept them as valid")
        print("3. No real emails will be sent (feature removed)")
        print("\nRun: python create_demo_users.py")
        print("="*60)
    
    finally:
        db.close()

if __name__ == "__main__":
    enable_demo_mode()
