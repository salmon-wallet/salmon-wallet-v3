import type { AddressBookItem } from '../settings';

/**
 * Props for the AddressBookPanel component (platform-agnostic base)
 */
export interface AddressBookPanelPropsBase {
  /** Callback when user wants to add a new contact */
  onAddContact: () => void;
  /** Callback when user wants to edit an existing contact */
  onEditContact: (contact: AddressBookItem) => void;
  /** Callback to navigate back */
  onBack: () => void;
}

/**
 * Props for the AddressAddPanel component (platform-agnostic base)
 */
export interface AddressAddPanelPropsBase {
  /** Callback when the contact is saved successfully */
  onSave: () => void;
  /** Callback to navigate back */
  onBack: () => void;
}

/**
 * Props for the AddressEditPanel component (platform-agnostic base)
 */
export interface AddressEditPanelPropsBase {
  /** The contact being edited */
  contact: AddressBookItem;
  /** Callback when the contact is saved successfully */
  onSave: () => void;
  /** Callback to navigate back */
  onBack: () => void;
}
