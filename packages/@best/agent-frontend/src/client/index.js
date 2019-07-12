import { buildCustomElementConstructor } from 'lwc';
import ViewDashboard from 'view/dashboard';

customElements.define('view-dashboard', buildCustomElementConstructor(ViewDashboard));
