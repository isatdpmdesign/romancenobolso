import Admin from './pages/Admin';
import AdminSupport from './pages/AdminSupport';
import BookDetails from './pages/BookDetails';
import Home from './pages/Home';
import ManageCarousel from './pages/ManageCarousel';
import ManageChapters from './pages/ManageChapters';
import MyBooks from './pages/MyBooks';
import Notifications from './pages/Notifications';
import Payment from './pages/Payment';
import Profile from './pages/Profile';
import Reader from './pages/Reader';
import Support from './pages/Support';
import Login from './pages/Login';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Admin": Admin,
    "AdminSupport": AdminSupport,
    "BookDetails": BookDetails,
    "Home": Home,
    "ManageCarousel": ManageCarousel,
    "ManageChapters": ManageChapters,
    "MyBooks": MyBooks,
    "Notifications": Notifications,
    "Payment": Payment,
    "Profile": Profile,
    "Reader": Reader,
    "Support": Support,
    "Login": Login,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};