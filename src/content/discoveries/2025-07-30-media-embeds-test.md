---
title: "Testing Auto Media Embeds"
date: 2025-07-30
author: "Research Team"
tags: ["Test", "Media", "Embeds"]
---

This post demonstrates automatic detection and embedding of various media types when URLs are on standalone lines.

## YouTube Videos

Here's a regular YouTube link that should auto-embed:

https://www.youtube.com/watch?v=dQw4w9WgXcQ

And here's a short YouTube link:

https://youtu.be/dQw4w9WgXcQ

## Spotify Content

A Spotify track should get a nice embed:

https://open.spotify.com/track/4iV5W9uYEdYUVa79Axb7Rh

## Twitter/X Posts

Twitter links get special preview treatment:

https://twitter.com/elonmusk/status/1234567890

## Regular Links

Regular links still work as before:

https://www.bloomberg.com

https://github.com/anthropics/claude-code

## SoundCloud

SoundCloud gets special preview styling:

https://soundcloud.com/artist/track-name

Regular inline links like [this one](https://example.com) remain unchanged as normal markdown links.

The system automatically detects the media type and renders the appropriate embed or preview!