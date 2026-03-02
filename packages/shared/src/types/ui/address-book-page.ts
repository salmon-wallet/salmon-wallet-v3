import type { AddressBookItem } from '../settings';

/**
 * Props for the AddressBookPage component (platform-agnostic base)
 */
export interface AddressBookPagePropsBase {
  /** Callback when user wants to add a new contact */
  onAddContact: () => void;
  /** Callback when user wants to edit an existing contact */
  onEditContact: (contact: AddressBookItem) => void;
  /** Callback to navigate back */
  onBack: () => void;
}

/**
 * Props for the AddressAddPage component (platform-agnostic base)
 */
export interface AddressAddPagePropsBase {
  /** Callback when the contact is saved successfully */
  onSave: () => void;
  /** Callback to navigate back */
  onBack: () => void;
}

/**
 * Props for the AddressEditPage component (platform-agnostic base)
 */
export interface AddressEditPagePropsBase {
  /** The contact being edited */
  contact: AddressBookItem;
  /** Callback when the contact is saved successfully */
  onSave: () => void;
  /** Callback to navigate back */
  onBack: () => void;
}
