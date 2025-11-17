# 💧 Water Reminder

A clean, minimalist VS Code extension to help you stay hydrated while coding! Features a modern, distraction-free UI that blends seamlessly with your development environment.

![Water Reminder](resources/icon.png)

## ✨ Features

- ⏰ **Customizable Timer** - Set reminders at your preferred intervals (default: 30 minutes)
- 🎨 **Minimalist UI** - Clean, modern design that doesn't distract from your work
- 📊 **Daily Progress Tracking** - Track your water intake and reach your daily goal
- 🔔 **Smart Notifications** - Get gentle reminders with sound alerts
- 📍 **Status Bar Integration** - Always see your timer and daily progress
- 🌳 **Sidebar View** - Quick access to controls in the activity bar
- 💾 **Persistent State** - Your progress is saved even when you close VS Code
- 🚀 **Auto-start** - Optionally restart the timer automatically after logging water

## 🎯 How to Use

### Quick Start

1. Install the extension
2. Click the water droplet icon (💧) in the Activity Bar
3. Click "▶️ Start Timer" to begin your first reminder
4. When the timer completes, you'll get a notification
5. Click "✅ I Drank Water!" to log your intake

### Views

**Sidebar View** - Compact tree view in the activity bar:
- See timer countdown
- View daily progress with visual progress bar
- Quick access to all controls

**Minimalist View** - Clean, modern webview:
- Large countdown display
- Simple progress tracking
- Professional aesthetics
- Click the desktop icon in sidebar title or status bar to open

### Commands

Access these commands from the Command Palette (Ctrl+Shift+P / Cmd+Shift+P):

- `Water Reminder: Start Timer` - Start or resume the countdown
- `Water Reminder: Pause Timer` - Pause the current countdown
- `Water Reminder: Reset Timer` - Reset to default interval
- `Water Reminder: I Drank Water!` - Log water intake and restart timer
- `Water Reminder: Open Retro View` - Open the minimalist webview
- `Water Reminder: Reset Daily Count` - Reset today's water count

## ⚙️ Settings

Customize the extension in VS Code Settings:

```json
{
  // Timer interval in minutes (1-240)
  "waterReminder.intervalMinutes": 30,
  
  // Enable/disable sound alerts
  "waterReminder.soundEnabled": true,
  
  // Auto-start timer after drinking water
  "waterReminder.autoStart": true,
  
  // Daily water intake goal (1-20)
  "waterReminder.dailyGoal": 8
}
```

## 🎨 Retro Design Elements

- **Neon Colors**: Vibrant pink, cyan, yellow, and green glow effects
- **CRT Monitor Effect**: Animated border with color rotation
- **7-Segment Display**: Digital clock-style countdown timer
- **Pixel Art**: Floating pixel animations for authentic retro feel
- **Arcade Frame**: 3D border effects with inner/outer glow
- **Smooth Animations**: Shimmer effects, glows, and transitions

## 🔊 Sound Notifications

The extension plays system sounds based on your platform:
- **Windows**: System beep
- **macOS**: Glass clink sound
- **Linux**: System notification sound

Disable sounds in settings if you prefer silent notifications.

## 📊 Progress Tracking

- **Daily Counter**: Tracks how many times you've logged water today
- **Goal System**: Set your daily target (default: 8 glasses)
- **Visual Progress**: Animated progress bar with percentage
- **Achievement**: Get a congratulatory message when you reach your goal
- **Auto-reset**: Progress resets automatically each day

## 🚀 Performance

- **Lightweight**: Minimal impact on VS Code performance
- **Persistent**: State saved to VS Code global storage
- **Background Timer**: Continues even when views are closed
- **Resume on Reload**: Timer continues after VS Code restart

## 🎮 Keyboard Shortcuts

No default shortcuts are set, but you can add your own in Keyboard Shortcuts settings:

```json
{
  "key": "ctrl+alt+w",
  "command": "waterReminder.drankWater"
}
```

## 🐛 Known Issues

- Sound playback requires system sound support
- Terminal may briefly appear when playing sounds (hidden by default)
- Progress resets at midnight based on system time

## 📝 Tips

1. **Set realistic intervals** - Start with 30-60 minutes
2. **Use the status bar** - Quick glance at remaining time
3. **Open retro view** - When you need motivation
4. **Adjust daily goal** - Based on your hydration needs
5. **Enable auto-start** - For consistent reminders

## 🤝 Contributing

Found a bug or have a feature request? Please open an issue on GitHub!

## 📜 License

MIT License - See LICENSE file for details

## 👏 Credits

Created with ❤️ for developers who forget to drink water while coding!

---

## 💡 Hydration Tips

- Drink water regularly, not just when thirsty
- Keep a water bottle at your desk
- Increase intake during intense coding sessions
- Water helps maintain focus and productivity
- Recommended: 8 glasses (64oz / 2L) per day

**Stay hydrated, stay productive! 💧✨**
