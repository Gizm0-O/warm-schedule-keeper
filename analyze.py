# Fix: Shared admin mode via sessionStorage
# ItalySavingsBanner: set adminMode on PIN success
# RewardsBanner: read adminMode from sessionStorage, hide Settings button

import re

# === FIX 1: ItalySavingsBanner.tsx ===
path_italy = 'src/components/ItalySavingsBanner.tsx'
with open(path_italy) as f:
    content = f.read()

# After setIsAdmin(true) in submitPin, add sessionStorage.setItem
old = '    setIsAdmin(true);'
new = '    setIsAdmin(true);\n    sessionStorage.setItem(\'adminMode\', \'1\');'
content = content.replace(old, new, 1)

with open(path_italy, 'w') as f:
    f.write(content)
print('ItalySavingsBanner fixed')

# === FIX 2: RewardsBanner.tsx ===
path_rewards = 'src/components/RewardsBanner.tsx'
with open(path_rewards) as f:
    content = f.read()

# 1. Add useEffect import if not present
if 'useEffect' not in content:
    content = content.replace('import { useState }', 'import { useState, useEffect }')
    print('Added useEffect import')

# 2. Replace ADMIN_PIN constant - remove it (admin mode comes from ItalySavings)
# Keep ADMIN_PIN for backward compat but add adminMode state
old_state = 'const [showAdminDialog, setShowAdminDialog] = useState(false);'
new_state = '''const [showAdminDialog, setShowAdminDialog] = useState(false);
  const [adminMode, setAdminMode] = useState(() => sessionStorage.getItem('adminMode') === '1');
  
  useEffect(() => {
    const handleStorage = () => setAdminMode(sessionStorage.getItem('adminMode') === '1');
    window.addEventListener('storage', handleStorage);
    const interval = setInterval(() => {
      setAdminMode(sessionStorage.getItem('adminMode') === '1');
    }, 500);
    return () => { window.removeEventListener('storage', handleStorage); clearInterval(interval); };
  }, []);'''
content = content.replace(old_state, new_state, 1)

# 3. In submitPin, also trigger adminMode update
old_submit = 'setAdminConfig({ ...rewards.config });'
new_submit = 'setAdminConfig({ ...rewards.config });\n      sessionStorage.setItem(\'adminMode\', \'1\');\n      setAdminMode(true);'
content = content.replace(old_submit, new_submit, 1)

# 4. Replace pinUnlocked condition for showing admin dialog content
# The Settings button that opens showAdminDialog - hide it, open dialog via adminMode instead
# Find Settings button onClick and replace with adminMode check
content = content.replace(
    'onClick={() => setShowAdminDialog(true)}',
    'onClick={() => { if(adminMode) setShowAdminDialog(true); }}'
)

# 5. Hide the Settings/gear button (make it invisible unless adminMode)
# Find the button with Settings icon and wrap with conditional
# Look for the settings button pattern
import re
# Replace Settings icon button to be hidden - add className condition
content = re.sub(
    r'(<button[^>]*onClick=\{[^}]*setShowAdminDialog[^}]*\}[^>]*>\s*<Settings)',
    r'<button style={{display: adminMode ? undefined : "none"}} onClick={() => setShowAdminDialog(true)}>\n              <Settings',
    content
)

with open(path_rewards, 'w') as f:
    f.write(content)
print('RewardsBanner fixed')
print('DONE')