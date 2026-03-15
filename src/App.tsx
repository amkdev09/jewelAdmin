import { BrowserRouter as Router, Routes, Route } from "react-router";
import SignIn from "./pages/AuthPages/SignIn";
import SignUp from "./pages/AuthPages/SignUp";
import NotFound from "./pages/OtherPage/NotFound";
import UserProfiles from "./pages/UserProfiles";
import Videos from "./pages/UiElements/Videos";
import Images from "./pages/UiElements/Images";
import Alerts from "./pages/UiElements/Alerts";
import Badges from "./pages/UiElements/Badges";
import Avatars from "./pages/UiElements/Avatars";
import Buttons from "./pages/UiElements/Buttons";
import LineChart from "./pages/Charts/LineChart";
import BarChart from "./pages/Charts/BarChart";
import Calendar from "./pages/Calendar";
import BasicTables from "./pages/Tables/BasicTables";
import FormElements from "./pages/Forms/FormElements";
import Blank from "./pages/Blank";
import AppLayout from "./layout/AppLayout";
import { ScrollToTop } from "./components/common/ScrollToTop";
import Home from "./pages/Dashboard/Home";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import Products from "./pages/Admin/Products";
import ProductDetail from "./pages/Admin/ProductDetail";
import ProductForm from "./pages/Admin/ProductForm";
import Orders from "./pages/Admin/Orders";
import OrderDetail from "./pages/Admin/OrderDetail";
import Users from "./pages/Admin/Users";
import Coupons from "./pages/Admin/Coupons";
import Banners from "./pages/Admin/Banners";
import GoldPrice from "./pages/Admin/GoldPrice";
import Categories from "./pages/Admin/Categories";
import Inventory from "./pages/Admin/Inventory";
import InventoryDetail from "./pages/Admin/InventoryDetail";
import Variants from "./pages/Admin/Variants";
import Reviews from "./pages/Admin/Reviews";

export default function App() {
  return (
    <>
      <Router>
        <ScrollToTop />
        <Routes>
          <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
            <Route index path="/" element={<Home />} />

            {/* Others Page */}
            <Route path="/profile" element={<UserProfiles />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/blank" element={<Blank />} />

            {/* Forms */}
            <Route path="/form-elements" element={<FormElements />} />

            {/* Tables */}
            <Route path="/basic-tables" element={<BasicTables />} />

            {/* Ui Elements */}
            <Route path="/alerts" element={<Alerts />} />
            <Route path="/avatars" element={<Avatars />} />
            <Route path="/badge" element={<Badges />} />
            <Route path="/buttons" element={<Buttons />} />
            <Route path="/images" element={<Images />} />
            <Route path="/videos" element={<Videos />} />

            {/* Charts */}
            <Route path="/line-chart" element={<LineChart />} />
            <Route path="/bar-chart" element={<BarChart />} />

            {/* Jewellery Admin */}
            <Route path="/admin/categories" element={<Categories />} />
            <Route path="/admin/products" element={<Products />} />
            <Route path="/admin/products/new" element={<ProductForm />} />
            <Route path="/admin/products/:id/edit" element={<ProductForm />} />
            <Route path="/admin/products/:id" element={<ProductDetail />} />
            <Route path="/admin/orders" element={<Orders />} />
            <Route path="/admin/orders/:id" element={<OrderDetail />} />
            <Route path="/admin/users" element={<Users />} />
            <Route path="/admin/coupons" element={<Coupons />} />
            <Route path="/admin/banners" element={<Banners />} />
            <Route path="/admin/gold-price" element={<GoldPrice />} />
            <Route path="/admin/inventory" element={<Inventory />} />
            <Route path="/admin/inventory/:id" element={<InventoryDetail />} />
            <Route path="/admin/variants" element={<Variants />} />
            <Route path="/admin/reviews" element={<Reviews />} />
          </Route>

          {/* Auth Layout (public) */}
          <Route path="/signin" element={<ProtectedRoute><SignIn /></ProtectedRoute>} />
          <Route path="/signup" element={<ProtectedRoute><SignUp /></ProtectedRoute>} />

          {/* Fallback Route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </>
  );
}
