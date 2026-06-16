#!/bin/bash
set -e
echo "Deploying OmniWeave contracts to Sui..."
cd "$(dirname "$0")"

NETWORK=${1:-mainnet}
echo "Target network: $NETWORK"
sui client switch --env $NETWORK

echo "Building contracts..."
sui move build

echo "Publishing..."
PUBLISH_OUTPUT=$(sui client publish --gas-budget 200000000 --json)

PACKAGE_ID=$(echo $PUBLISH_OUTPUT | jq -r '.objectChanges[] | select(.type=="published") | .packageId')
echo "Package ID: $PACKAGE_ID"

# Extract created shared objects
CONFIG_ID=$(echo $PUBLISH_OUTPUT | jq -r '.objectChanges[] | select(.objectType | contains("Config")) | .objectId')
TREASURY_ID=$(echo $PUBLISH_OUTPUT | jq -r '.objectChanges[] | select(.objectType | contains("Treasury")) | .objectId')
ADMIN_CAP_ID=$(echo $PUBLISH_OUTPUT | jq -r '.objectChanges[] | select(.objectType | contains("AdminCap")) | .objectId')

echo ""
echo "Add these to your .env.local:"
echo "NEXT_PUBLIC_ROUTER_PACKAGE_ID=$PACKAGE_ID"
echo "NEXT_PUBLIC_CONFIG_OBJECT_ID=$CONFIG_ID"
echo "NEXT_PUBLIC_TREASURY_OBJECT_ID=$TREASURY_ID"
echo "NEXT_PUBLIC_ADMIN_CAP_ID=$ADMIN_CAP_ID"
