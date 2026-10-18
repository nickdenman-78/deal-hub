<script setup lang="ts">
/**
 * Throws during setup, standing in for a failed loader or a bad API response.
 *
 * A separate component on purpose: onErrorCaptured only sees errors from
 * DESCENDANTS, so a blade cannot catch a throw in its own setup. Any real
 * screen has this shape anyway — the blade is the frame, the thing that can
 * fail is inside it.
 */
throw new Error('Settlement service returned 503 (Service Unavailable).');
</script>

<template>
  <p>Never rendered.</p>
</template>
