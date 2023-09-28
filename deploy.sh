#!/bin/sh
DOCUMENT_ROOT=/var/www/sources

# Take site offline
echo "Taking site offline..."
touch $DOCUMENT_ROOT/maintenance.file

# Swap over the content
echo "Deploying content..."
mkdir -p $DOCUMENT_ROOT/Twitch
cp twitch.png $DOCUMENT_ROOT/Twitch
cp TwitchConfig.json $DOCUMENT_ROOT/Twitch
cp TwitchScript.js $DOCUMENT_ROOT/Twitch
sh sign.sh $DOCUMENT_ROOT/Twitch/TwitchScript.js $DOCUMENT_ROOT/Twitch/TwitchConfig.json

# Notify Cloudflare to wipe the CDN cache
echo "Purging Cloudflare cache for zone $CLOUDFLARE_ZONE_ID..."
curl -X POST "https://api.cloudflare.com/client/v4/zones/$CLOUDFLARE_ZONE_ID/purge_cache" \
     -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
     -H "Content-Type: application/json" \
     --data '{"files":["https://plugins.grayjay.app/Twitch/twitch.png", "https://plugins.grayjay.app/Twitch/TwitchConfig.json", "https://plugins.grayjay.app/Twitch/TwitchScript.js"]}'

# Take site back online
echo "Bringing site back online..."
rm $DOCUMENT_ROOT/maintenance.file
