#!/bin/bash
cd /home/kavia/workspace/code-generation/solution-builder-platform-26677-26686/react_frontend
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

