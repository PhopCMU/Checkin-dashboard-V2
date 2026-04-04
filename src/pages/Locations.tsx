import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import {
  MapPin,
  Trash2,
  Edit3,
  PlusCircle,
  Save,
  X,
  Navigation,
  Globe,
  Ruler,
  Palette,
  Search,
  Download,
  Eye,
  EyeOff,
  Map,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { getUserFromToken } from "../utils/authService";
import { GetLocationsLists } from "../services/serviceGet";
import { useAlert } from "../contexts/AlertContext";
import { PutUpdateLocation } from "../services/servicePut";
import { Postaddlocation } from "../services/servicePost";
import { useConfirm } from "../contexts/useConfirm";
import { DeleteLocation } from "../services/serviceDelete";

// --- Types ---
interface LocationItem {
  id?: number;
  name: string;
  lat: number;
  lng: number;
  radius: number;
  color: string;
  status?: boolean;
}

export default function Locations() {
  // --- States ---
  const [locations, setLocations] = useState<LocationItem[]>([]);
  const [filteredLocations, setFilteredLocations] = useState<LocationItem[]>(
    [],
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState<
    "all" | "active" | "inactive"
  >("all");

  const [formData, setFormData] = useState<LocationItem>({
    id: 0,
    name: "",
    lat: 0,
    lng: 0,
    radius: 50,
    color: "#3b82f6",
    status: true,
  });

  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showMapPreview, setShowMapPreview] = useState<boolean>(false);

  // --- Refs ---
  const user = getUserFromToken()!;
  const { showAlert } = useAlert();
  const hasFetchDataRef = useRef(false);
  const formRef = useRef<HTMLFormElement>(null);

  // --- Effects ---
  useEffect(() => {
    if (hasFetchDataRef.current) return;
    hasFetchDataRef.current = true;
    fetchDataLocations();
  }, []);

  useEffect(() => {
    filterLocations();
  }, [locations, searchTerm, activeFilter]);

  // Confirmation Modal
  const confirm = useConfirm();

  // --- Fetch Data ---
  const fetchDataLocations = async () => {
    if (!user?.email) return;
    setIsLoading(true);
    try {
      const resp = await GetLocationsLists(user?.email);

      if (Array.isArray(resp.results)) {
        const locationsWithStatus = resp.results.map((loc: any) => ({
          ...loc,
          status: loc.status !== undefined ? loc.status : true,
        }));
        setLocations(locationsWithStatus);
      }

      showAlert({
        type: "success",
        title: "ข้อมูลตำแหน่ง",
        message: "โหลดข้อมูลตำแหน่งสำเร็จ",
        duration: 3000,
      });
    } catch (e) {
      console.error("Error fetching locations:", e);
      showAlert({
        type: "error",
        title: "เกิดข้อผิดพลาด",
        message: "ไม่สามารถโหลดข้อมูลตำแหน่งได้",
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // --- Filter Functions (Improved) ---
  const filterLocations = () => {
    let filtered = [...locations];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter((loc) =>
        loc.name.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    // Apply status filter - handle undefined status
    if (activeFilter === "active") {
      filtered = filtered.filter((loc) => loc.status === true);
    } else if (activeFilter === "inactive") {
      filtered = filtered.filter((loc) => loc.status === false);
    }

    setFilteredLocations(filtered);
  };

  // --- Handlers ---
  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value, type } = e.target;

    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({
        ...prev,
        [name]: checked,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]:
          name === "lat" || name === "lng" || name === "radius"
            ? parseFloat(value) || 0
            : value,
      }));
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    // Validate coordinates
    if (Math.abs(formData.lat) > 90 || Math.abs(formData.lng) > 180) {
      showAlert({
        type: "error",
        title: "พิกัดไม่ถูกต้อง",
        message:
          "ค่าพิกัด Latitude ต้องอยู่ระหว่าง -90 ถึง 90 และ Longitude ระหว่าง -180 ถึง 180",
        duration: 5000,
      });
      return;
    }

    const payload = {
      ...formData,
      userEmail: user.email ?? "",
    };

    if (isEditing) {
      // Update existing location
      const resp = await PutUpdateLocation(payload);
      if (!resp.success) {
        showAlert({
          type: "error",
          title: "เกิดข้อผิดพลาด",
          message: "ไม่สามารถอัปเดตตำแหน่งได้",
          duration: 5000,
        });
        return;
      }

      await fetchDataLocations();
      showAlert({
        type: "success",
        title: "อัปเดตสำเร็จ",
        message: "อัปเดตข้อมูลตำแหน่งเรียบร้อยแล้ว",
        duration: 3000,
      });
      resetForm();
    } else {
      // Add new location
      const newLocation = {
        ...formData,
        userEmail: user.email ?? "",
      };

      const resp = await Postaddlocation(newLocation);

      if (!resp.success) {
        showAlert({
          type: "error",
          title: "เกิดข้อผิดพลาด",
          message: "ไม่สามารถเพิ่มตำแหน่งใหม่ได้",
          duration: 5000,
        });
      }

      await fetchDataLocations();
      showAlert({
        type: "success",
        title: "เพิ่มตำแหน่งสำเร็จ",
        message: "เพิ่มตำแหน่งใหม่ลงในระบบเรียบร้อยแล้ว",
        duration: 3000,
      });
      resetForm();
    }

    // resetForm();
    formRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const editLocation = (loc: LocationItem) => {
    setFormData(loc);
    setIsEditing(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const deleteLocation = async (id: number) => {
    const isConfirme = await confirm(
      "ยืนยันการลบตำแหน่ง",
      "คุณต้องการลบตำแหน่งนี้หรือไม่?",
    );

    if (!isConfirme) {
      return;
    }

    const resp = await DeleteLocation(id);

    if (!resp.success) {
      showAlert({
        type: "error",
        title: "เกิดข้อผิดพลาด",
        message: "ไม่สามารถลบตำแหน่งได้",
        duration: 5000,
      });
      return;
    }

    await fetchDataLocations();
    showAlert({
      type: "warning",
      title: "ลบตำแหน่งแล้ว",
      message: "ตำแหน่งถูกลบออกจากระบบเรียบร้อยแล้ว",
      duration: 3000,
    });
  };

  // --- Toggle Status Function (Fixed) ---
  const toggleLocationStatus = async (id: string | number) => {
    try {
      // Find the location to toggle
      const locationToToggle = locations.find((loc) => loc.id === id);
      if (!locationToToggle) return;

      // Toggle the status
      const newStatus = !locationToToggle.status;

      // Update local state immediately for better UX
      setLocations(
        locations.map((loc) =>
          loc.id === id ? { ...loc, status: newStatus } : loc,
        ),
      );

      // Update backend
      const payload = {
        ...locationToToggle,
        status: newStatus,
        userEmail: user.email ?? "",
      };

      const resp = await PutUpdateLocation(payload);

      if (!resp.success) {
        // Revert if backend update fails
        setLocations(
          locations.map((loc) =>
            loc.id === id ? { ...loc, status: !newStatus } : loc,
          ),
        );
        showAlert({
          type: "error",
          title: "เกิดข้อผิดพลาด",
          message: "ไม่สามารถอัปเดตสถานะตำแหน่งได้",
          duration: 5000,
        });
        return;
      }

      showAlert({
        type: "success",
        title: "อัปเดตสถานะสำเร็จ",
        message: `ตำแหน่งถูก${newStatus ? "เปิดใช้งาน" : "ปิดใช้งาน"}เรียบร้อยแล้ว`,
        duration: 3000,
      });
    } catch (error) {
      console.error("Error toggling status:", error);
      showAlert({
        type: "error",
        title: "เกิดข้อผิดพลาด",
        message: "ไม่สามารถอัปเดตสถานะได้",
        duration: 5000,
      });
    }
  };

  const resetForm = () => {
    setFormData({
      id: 0,
      name: "",
      lat: 0,
      lng: 0,
      radius: 50,
      color: "#3b82f6",
      status: true,
    });
    setIsEditing(false);
  };

  const handleMapClick = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        setFormData((prev) => ({
          ...prev,
          lat: parseFloat(position.coords.latitude.toFixed(6)),
          lng: parseFloat(position.coords.longitude.toFixed(6)),
        }));
        showAlert({
          type: "success",
          title: "กำหนดตำแหน่งสำเร็จ",
          message: "กำหนดพิกัดจากตำแหน่งปัจจุบันเรียบร้อยแล้ว",
          duration: 3000,
        });
      });
    }
  };

  const exportLocations = () => {
    const dataStr = JSON.stringify(locations, null, 2);
    const dataUri =
      "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);
    const exportFileDefaultName = `locations-${new Date().toISOString().split("T")[0]}.json`;

    const linkElement = document.createElement("a");
    linkElement.setAttribute("href", dataUri);
    linkElement.setAttribute("download", exportFileDefaultName);
    linkElement.click();

    showAlert({
      type: "info",
      title: "ส่งออกข้อมูล",
      message: "ส่งออกข้อมูลตำแหน่งเรียบร้อยแล้ว",
      duration: 3000,
    });
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 to-blue-50 p-4 md:p-6 font-sans">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-12 h-12 bg-linear-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg">
                  <MapPin className="w-6 h-6 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-linear-to-r from-emerald-500 to-teal-500 rounded-full flex items-center justify-center shadow">
                  <Navigation className="w-3 h-3 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold bg-linear-to-r from-blue-800 to-indigo-800 bg-clip-text text-transparent">
                  Location Manager
                </h1>
                <p className="text-gray-600 text-sm md:text-base">
                  จัดการพิกัดและรัศมีสำหรับระบบบันทึกเวลาปฏิบัติงาน
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={exportLocations}
                className="px-4 py-2 bg-white border border-gray-300 hover:border-gray-400 rounded-lg flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors shadow-sm"
              >
                <Download className="w-4 h-4" />
                Export
              </button>
              <button
                onClick={fetchDataLocations}
                disabled={isLoading}
                className="px-4 py-2 bg-linear-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg flex items-center gap-2 text-sm font-medium transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                Refresh
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">ทั้งหมด</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {locations.length}
                  </p>
                </div>
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Map className="w-5 h-5 text-blue-600" />
                </div>
              </div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">ใช้งานอยู่</p>
                  <p className="text-2xl font-bold text-emerald-600">
                    {locations.filter((l) => l.status).length}
                  </p>
                </div>
                <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <Eye className="w-5 h-5 text-emerald-600" />
                </div>
              </div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">ไม่ใช้งาน</p>
                  <p className="text-2xl font-bold text-amber-600">
                    {locations.filter((l) => !l.status).length}
                  </p>
                </div>
                <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                  <EyeOff className="w-5 h-5 text-amber-600" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form Section */}
          <section className="lg:col-span-1" ref={formRef}>
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden sticky top-6">
              <div className="bg-linear-to-r from-blue-700 to-indigo-800 p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                      {isEditing ? (
                        <Edit3 className="w-5 h-5 text-white" />
                      ) : (
                        <PlusCircle className="w-5 h-5 text-white" />
                      )}
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white">
                        {isEditing ? "แก้ไขตำแหน่ง" : "เพิ่มตำแหน่งใหม่"}
                      </h2>
                      <p className="text-blue-100 text-sm">
                        {isEditing
                          ? "แก้ไขข้อมูลตำแหน่งที่เลือก"
                          : "เพิ่มตำแหน่งใหม่ลงในระบบ"}
                      </p>
                    </div>
                  </div>
                  {isEditing && (
                    <button
                      onClick={resetForm}
                      className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                    >
                      <X className="w-5 h-5 text-white" />
                    </button>
                  )}
                </div>
              </div>

              <form onSubmit={handleSubmit} className="p-6">
                <div className="space-y-5">
                  <div>
                    <label className=" text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      ชื่อสถานที่ *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      placeholder="เช่น ตึกอำนวยการ, โรงพยาบาลสัตว์"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder:text-gray-400"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className=" text-sm font-medium text-gray-700 flex items-center gap-2">
                        <Navigation className="w-4 h-4" />
                        พิกัดทางภูมิศาสตร์ *
                      </label>
                      <button
                        type="button"
                        onClick={handleMapClick}
                        className="text-xs px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                      >
                        ใช้ตำแหน่งปัจจุบัน
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className=" text-xs text-gray-500 mb-1">
                          Latitude
                        </label>
                        <input
                          type="number"
                          step="any"
                          name="lat"
                          value={formData.lat || ""}
                          onChange={handleChange}
                          required
                          placeholder="18.805792"
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all font-mono text-sm placeholder:text-gray-400"
                        />
                      </div>
                      <div>
                        <label className=" text-xs text-gray-500 mb-1">
                          Longitude
                        </label>
                        <input
                          type="number"
                          step="any"
                          name="lng"
                          value={formData.lng || ""}
                          onChange={handleChange}
                          required
                          placeholder="98.952739"
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all font-mono text-sm placeholder:text-gray-400"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className=" text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                        <Ruler className="w-4 h-4" />
                        รัศมี (เมตร)
                      </label>
                      <input
                        type="number"
                        name="radius"
                        min="1"
                        value={formData.radius}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className=" text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                        <Palette className="w-4 h-4" />
                        สีบนแผนที่
                      </label>
                      <div className="flex items-center gap-3">
                        <input
                          type="color"
                          name="color"
                          value={formData.color}
                          onChange={handleChange}
                          className="w-12 h-12 p-1 rounded-lg border-2 border-gray-300 cursor-pointer bg-transparent"
                        />
                        <span className="text-sm font-mono bg-gray-100 px-3 py-1.5 rounded-lg">
                          {formData.color}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <div className="relative">
                        <input
                          type="checkbox"
                          name="status"
                          checked={formData.status}
                          onChange={handleChange}
                          className="sr-only"
                        />
                        <div
                          className={`w-10 h-6 rounded-full transition-colors ${formData.status ? "bg-emerald-500" : "bg-gray-300"}`}
                        >
                          <div
                            className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${formData.status ? "left-5" : "left-1"}`}
                          />
                        </div>
                      </div>
                      <span className="text-sm text-gray-700">สถานะใช้งาน</span>
                    </label>
                  </div>

                  <div className="pt-4 space-y-3">
                    <button
                      type="submit"
                      className="w-full bg-linear-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-semibold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg active:scale-[0.98]"
                    >
                      <Save className="w-5 h-5" />
                      {isEditing ? "บันทึกการแก้ไข" : "เพิ่มตำแหน่งใหม่"}
                    </button>

                    {isEditing && (
                      <button
                        type="button"
                        onClick={resetForm}
                        className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 rounded-xl transition-colors"
                      >
                        ยกเลิกการแก้ไข
                      </button>
                    )}
                  </div>
                </div>
              </form>
            </div>
          </section>

          {/* List Section */}
          <section className="lg:col-span-2">
            {/* Search and Filter Bar */}
            <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm mb-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="ค้นหาตำแหน่งด้วยชื่อหรือคำอธิบาย..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <div className="flex border border-gray-300 rounded-xl overflow-hidden">
                    <button
                      onClick={() => setActiveFilter("all")}
                      className={`px-4 py-2 text-sm font-medium transition-colors ${activeFilter === "all" ? "bg-blue-600 text-white" : "bg-gray-50 text-gray-700 hover:bg-gray-100"}`}
                    >
                      ทั้งหมด
                    </button>
                    <button
                      onClick={() => setActiveFilter("active")}
                      className={`px-4 py-2 text-sm font-medium transition-colors ${activeFilter === "active" ? "bg-emerald-600 text-white" : "bg-gray-50 text-gray-700 hover:bg-gray-100"}`}
                    >
                      ใช้งาน
                    </button>
                    <button
                      onClick={() => setActiveFilter("inactive")}
                      className={`px-4 py-2 text-sm font-medium transition-colors ${activeFilter === "inactive" ? "bg-amber-600 text-white" : "bg-gray-50 text-gray-700 hover:bg-gray-100"}`}
                    >
                      ไม่ใช้งาน
                    </button>
                  </div>

                  <button
                    onClick={() => setShowMapPreview(!showMapPreview)}
                    className="px-4 py-2 bg-gray-50 border border-gray-300 hover:bg-gray-100 rounded-xl flex items-center gap-2 text-sm font-medium text-gray-700 transition-colors"
                  >
                    <Map className="w-4 h-4" />
                    {showMapPreview ? "ซ่อนแผนที่" : "แสดงแผนที่"}
                  </button>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between text-sm">
                <div className="text-gray-600">
                  แสดงทั้งหมด{" "}
                  <span className="font-semibold text-gray-900">
                    {filteredLocations.length}
                  </span>{" "}
                  จาก{" "}
                  <span className="font-semibold text-gray-900">
                    {locations.length}
                  </span>{" "}
                  ตำแหน่ง
                </div>
                <div className="flex items-center gap-2 text-gray-500">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                    <span>ใช้งาน</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                    <span>ไม่ใช้งาน</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Locations List */}
            <div className="space-y-4">
              {isLoading ? (
                <div className="bg-white rounded-2xl p-12 text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
                  <p className="text-gray-600">กำลังโหลดข้อมูลตำแหน่ง...</p>
                </div>
              ) : filteredLocations.length === 0 ? (
                <div className="bg-white rounded-2xl p-12 text-center border border-gray-200">
                  <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <MapPin className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">
                    ไม่พบตำแหน่ง
                  </h3>
                  <p className="text-gray-500 max-w-md mx-auto">
                    {searchTerm
                      ? "ไม่พบตำแหน่งที่ตรงกับการค้นหาของคุณ"
                      : "ยังไม่มีตำแหน่งในระบบ คลิกเพิ่มตำแหน่งใหม่เพื่อเริ่มต้น"}
                  </p>
                </div>
              ) : (
                filteredLocations.map((loc: any) => (
                  <>
                    {<>{console.log(loc)}</>}
                    <div
                      key={loc.id}
                      className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
                    >
                      <div className="p-5">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-start gap-4">
                            <div className="relative">
                              <div
                                className="w-12 h-12 rounded-xl flex items-center justify-center"
                                style={{ backgroundColor: `${loc.color}20` }}
                              >
                                <MapPin
                                  className="w-6 h-6"
                                  style={{ color: loc.color }}
                                />
                              </div>
                              <div
                                className={`absolute -top-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center ${loc.status ? "bg-emerald-100 text-emerald-600" : "bg-amber-100 text-amber-600"}`}
                              >
                                {loc.status ? (
                                  <CheckCircle2 className="w-3 h-3" />
                                ) : (
                                  <AlertCircle className="w-3 h-3" />
                                )}
                              </div>
                            </div>

                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="text-lg font-semibold text-gray-900">
                                  {loc.name}
                                </h3>
                                {!loc.status && (
                                  <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-xs rounded-full font-medium">
                                    ไม่ใช้งาน
                                  </span>
                                )}
                              </div>

                              <div className="flex flex-wrap gap-4 text-sm">
                                <div className="flex items-center gap-1.5">
                                  <Globe className="w-4 h-4 text-gray-400" />
                                  <span className="font-mono text-gray-700">
                                    {loc.lat.toFixed(6)}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <Globe className="w-4 h-4 text-gray-400" />
                                  <span className="font-mono text-gray-700">
                                    {loc.lng.toFixed(6)}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <Ruler className="w-4 h-4 text-gray-400" />
                                  <span className="text-gray-700">
                                    {loc.radius} เมตร
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => toggleLocationStatus(loc.id)}
                              className={`p-2 rounded-lg ${loc.status ? "bg-emerald-50 text-emerald-600 hover:bg-emerald-100" : "bg-amber-50 text-amber-600 hover:bg-amber-100"} transition-colors`}
                              title={
                                loc.status
                                  ? "ปิดใช้งานตำแหน่งนี้"
                                  : "เปิดใช้งานตำแหน่งนี้"
                              }
                            >
                              {loc.status ? (
                                <Eye className="w-4 h-4" />
                              ) : (
                                <EyeOff className="w-4 h-4" />
                              )}
                            </button>
                            <button
                              onClick={() => editLocation(loc)}
                              className="p-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                              title="แก้ไขตำแหน่งนี้"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => deleteLocation(loc.id)}
                              className="p-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                              title="ลบตำแหน่งนี้"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {showMapPreview && (
                          <div className="mt-4 pt-4 border-t border-gray-100">
                            <div className="flex items-center gap-2 mb-2 text-sm text-gray-700">
                              <Map className="w-4 h-4" />
                              <span>ตัวอย่างบนแผนที่</span>
                            </div>
                            <div className="h-40 bg-linear-to-r from-blue-50 to-indigo-50 rounded-xl border border-gray-200 flex items-center justify-center">
                              <div className="text-center">
                                <div className="w-12 h-12 mx-auto mb-2 relative">
                                  <div
                                    className="absolute inset-0 rounded-full animate-ping"
                                    style={{
                                      backgroundColor: loc.color,
                                      opacity: 0.3,
                                    }}
                                  ></div>
                                  <div
                                    className="relative w-12 h-12 rounded-full flex items-center justify-center"
                                    style={{ backgroundColor: loc.color }}
                                  >
                                    <MapPin className="w-6 h-6 text-white" />
                                  </div>
                                </div>
                                <p className="text-sm text-gray-600">
                                  ตำแหน่ง: {loc.lat.toFixed(4)},{" "}
                                  {loc.lng.toFixed(4)}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                  รัศมี: {loc.radius} เมตร
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                ))
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

// Add missing RefreshCw icon component
const RefreshCw = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
    />
  </svg>
);
