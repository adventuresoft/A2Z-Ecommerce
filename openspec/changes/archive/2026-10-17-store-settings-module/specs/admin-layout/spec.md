# Spec Delta

## ADDED Requirements

### Requirement: Live Store Settings Administrative Views
The admin application SHALL provide a functional AdminLTE 4 styled tabbed interface at `/system/settings` allowing administrators to inspect, configure, and save store settings organized into logical groups (General Store Info, Localization & Currency, Order & Checkout Rules, Inventory Rules, Shipping Policies, Notification Channels, and Maintenance/SEO), replacing the placeholder shell.

#### Scenario: Admin navigates to store settings view
- **WHEN** an administrator navigates to `/system/settings`
- **THEN** the application renders the tabbed settings interface displaying active values populated from the backend API, with tab switching and save actions per section.

#### Scenario: Admin updates store settings
- **WHEN** an administrator modifies configuration fields in a tab and clicks "Save Settings"
- **THEN** the application validates the inputs, submits the batch update to the API, and displays success notification feedback upon confirmation.
