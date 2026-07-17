import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  notificationContent,
  reactionNotificationContent,
  resolveStatusNotificationType,
} from "./notifications.types.js";

describe("resolveStatusNotificationType", () => {
  it("maps free_board -> community_confirmed to post_community_confirmed", () => {
    assert.equal(
      resolveStatusNotificationType("free_board", "community_confirmed"),
      "post_community_confirmed",
    );
  });

  it("maps admin_verified -> community_confirmed to post_admin_unverified", () => {
    assert.equal(
      resolveStatusNotificationType("admin_verified", "community_confirmed"),
      "post_admin_unverified",
    );
  });

  it("maps admin verify/reject/resolve/expire actions", () => {
    assert.equal(
      resolveStatusNotificationType("community_confirmed", "admin_verified"),
      "post_admin_verified",
    );
    assert.equal(
      resolveStatusNotificationType("free_board", "rejected"),
      "post_rejected",
    );
    assert.equal(
      resolveStatusNotificationType("admin_verified", "resolved"),
      "post_resolved",
    );
    assert.equal(
      resolveStatusNotificationType("community_confirmed", "expired"),
      "post_expired",
    );
  });

  it("skips identical status transitions", () => {
    assert.equal(
      resolveStatusNotificationType("community_confirmed", "community_confirmed"),
      null,
    );
  });

  it("skips non-notifiable statuses like free_board", () => {
    assert.equal(
      resolveStatusNotificationType("rejected", "free_board"),
      null,
    );
  });
});

describe("notificationContent", () => {
  it("builds admin and community messages for the uploader", () => {
    assert.equal(
      notificationContent("post_community_confirmed", "Flooded road").message,
      "Your post 'Flooded road' became Community Confirmed",
    );
    assert.equal(
      notificationContent("post_admin_verified", "Flooded road").message,
      'Admin verified your post "Flooded road"',
    );
    assert.equal(
      notificationContent("post_admin_unverified", "Flooded road").message,
      "Admin removed verification from your post 'Flooded road'",
    );
  });
});

describe("reactionNotificationContent", () => {
  it("includes actor, reaction, and post title", () => {
    assert.equal(
      reactionNotificationContent("[DEMO] Reactor", "confirm", "Flooded road")
        .message,
      "[DEMO] Reactor confirmed your post 'Flooded road'",
    );
    assert.equal(
      reactionNotificationContent("[DEMO] Reactor", "useful", "Flooded road")
        .message,
      "[DEMO] Reactor marked your post 'Flooded road' as useful",
    );
  });
});
