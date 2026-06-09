# Coin Merge — Launch Checklist

Use this list before flipping the project to "published". Tick each row in
the preview, then on a mobile device, then on the published URL.

## Gameplay
- [ ] Tiles spawn (2 or 4) on every successful move
- [ ] Merge math is correct (a + a = 2a, score increments by 2a)
- [ ] Score and "Best" update; "Best" persists across refresh
- [ ] No moves possible → Game Over modal appears
- [ ] Restart button + "Play again" both reset board, score, run state
- [ ] Reaching LEGENDARY triggers the Ritual achievement modal once per run
- [ ] Mobile swipe gestures move in all four directions
- [ ] Arrow keys work on desktop and don't scroll the page

## Wallets
- [ ] Connect prompts the injected wallet (MetaMask / Rabby / Coinbase…)
- [ ] After connect, profile, leaderboard rank, and streak load
- [ ] Refreshing the page silently restores the session
- [ ] Switching accounts in the wallet updates the UI
- [ ] Disconnect clears profile, recorded score, daily standing
- [ ] On mobile without a wallet, "Connect" deep-links into MetaMask in-app

## Ritual Integration
- [ ] After unlocking LEGENDARY, "Record on Ritual" is visible and enabled
- [ ] Achievement recording switches/adds the Ritual chain in the wallet
- [ ] Successful achievement tx is persisted per-wallet (no duplicate prompts)
- [ ] Beating the best score after game over surfaces the score prompt
- [ ] Score prompt records a tx and updates the Ritual Score card status

## Explorer Verification
- [ ] Achievement card shows "View on Ritual Explorer" after recording
- [ ] Score card shows "View on Ritual Explorer" after recording
- [ ] Profile shows last achievement tx + last score tx with explorer links
- [ ] Each link opens https://explorer.ritualfoundation.org/tx/<hash>
- [ ] Each click fires an `explorer_opened` analytics event (devtools console)

## gSiggy Flow
- [ ] Locked state shows "Reach Ritual LEGENDARY to unlock"
- [ ] Eligible state shows "Holder" prestige card with unlock date
- [ ] Mint button reads "Mint Coming Soon" and is disabled
- [ ] Eligibility survives wallet reconnect and is sticky on the server

## Leaderboards
- [ ] Today's scores render after submission
- [ ] Current player is highlighted in the list
- [ ] Player rank/score appear in the profile "Today" stat
- [ ] Streak count matches actual consecutive playing days

## Mobile Testing
- [ ] Layout fits 360px wide viewport with no horizontal scroll
- [ ] Tap targets ≥ 40px (restart, connect, record buttons)
- [ ] Modals are fully visible and dismissible
- [ ] Animations stay smooth (no frame drops) during swipes

## Analytics Hooks (devtools → console, filter `[analytics]`)
- [ ] `wallet_connected` on first connect
- [ ] `wallet_disconnected` on disconnect
- [ ] `game_started` on every restart
- [ ] `game_ended` with `score` and `best_tier`
- [ ] `new_high_score` when the local best is beaten
- [ ] `legendary_unlocked` first time LEGENDARY appears
- [ ] `achievement_recorded` with `tx`
- [ ] `score_recorded` with `tx` and `score`
- [ ] `explorer_opened` on every explorer link click
