/**
 * WalletSwitcherSheet Component Exports
 *
 * A TopSheet-based component for switching between wallet accounts.
 * Shows a list of accounts with avatars, names, and addresses,
 * with the ability to select an account or add a new one.
 *
 * @example
 * ```tsx
 * import { WalletSwitcherSheet } from '../components/WalletSwitcherSheet';
 *
 * function HomeScreen() {
 *   const [showSwitcher, setShowSwitcher] = useState(false);
 *   const [{ accounts, accountId }, { changeAccount }] = useAccounts();
 *
 *   return (
 *     <>
 *       <Header onWalletPress={() => setShowSwitcher(true)} />
 *       <WalletSwitcherSheet
 *         visible={showSwitcher}
 *         onClose={() => setShowSwitcher(false)}
 *         accounts={accounts}
 *         activeAccountId={accountId ?? ''}
 *         onSelectAccount={changeAccount}
 *         onAddAccount={() => router.push('/auth')}
 *       />
 *     </>
 *   );
 * }
 * ```
 */

export { WalletSwitcherSheet, default } from './WalletSwitcherSheet';
export type {
  WalletSwitcherSheetProps,
  AccountListItemProps,
} from './types';
