// Copyright (c) Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0

/// A private note storage on Sui blockchain
/// Rules:
/// - anyone can create a Note
/// - only the owner can update or delete their Note
module hello_world::greeting {
  use std::string;

  /// A private note - owned by the creator
  public struct Note has key, store {
    id: UID,
    owner: address,
    title: string::String,
    content: string::String,
  }

  /// Create a new Note - returns it for the caller to handle
  public fun new(ctx: &mut TxContext, title: string::String, content: string::String): Note {
    Note { 
      id: object::new(ctx),
      owner: ctx.sender(),
      title,
      content,
    }
  }

  /// Update Note content - only owner can call
  public fun update_content(note: &mut Note, new_title: string::String, new_content: string::String, ctx: &mut TxContext) {
    assert!(note.owner == ctx.sender(), 0);
    note.title = new_title;
    note.content = new_content;
  }

  /// Delete Note - only owner can call
  public fun delete(note: Note, ctx: &mut TxContext) {
    assert!(note.owner == ctx.sender(), 0);
    let Note { id, owner: _, title: _, content: _ } = note;
    object::delete(id);
  }
}