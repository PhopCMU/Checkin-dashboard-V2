import { Mail, Phone, MapPin, Calendar, Edit } from "lucide-react";

const Profile = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-gray-800">Profile</h2>
        <p className="text-gray-600 mt-1">จัดการข้อมูลโปรไฟล์ของคุณ</p>
      </div>

      {/* Profile Card */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {/* Cover Image */}
        <div className="h-32 bg-linear-to-r from-blue-500 to-purple-600"></div>

        {/* Profile Info */}
        <div className="px-6 pb-6">
          {/* Avatar */}
          <div className="flex flex-col md:flex-row md:items-end md:justify-between -mt-16 mb-6">
            <div className="flex items-end space-x-4">
              <div className="w-32 h-32 rounded-full bg-white p-2 shadow-lg">
                <div className="w-full h-full rounded-full bg-blue-500 flex items-center justify-center text-white text-4xl font-bold">
                  JD
                </div>
              </div>
              <div className="pb-2">
                <h3 className="text-2xl font-bold text-gray-800">John Doe</h3>
                <p className="text-gray-600">Administrator</p>
              </div>
            </div>
            <button className="mt-4 md:mt-0 flex items-center justify-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
              <Edit className="w-4 h-4" />
              <span>Edit Profile</span>
            </button>
          </div>

          {/* Contact Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
              <Mail className="w-5 h-5 text-gray-600" />
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium text-gray-800">
                  john.doe@example.com
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
              <Phone className="w-5 h-5 text-gray-600" />
              <div>
                <p className="text-sm text-gray-500">Phone</p>
                <p className="font-medium text-gray-800">+66 123-456-7890</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
              <MapPin className="w-5 h-5 text-gray-600" />
              <div>
                <p className="text-sm text-gray-500">Location</p>
                <p className="font-medium text-gray-800">Bangkok, Thailand</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
              <Calendar className="w-5 h-5 text-gray-600" />
              <div>
                <p className="text-sm text-gray-500">Joined</p>
                <p className="font-medium text-gray-800">January 2024</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* About Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-xl font-semibold mb-4">About</h3>
        <p className="text-gray-600 leading-relaxed">
          ผู้ดูแลระบบที่มีประสบการณ์ในการจัดการและพัฒนาระบบต่างๆ
          มีความเชี่ยวชาญในด้าน Web Development, Database Management และ System
          Architecture
        </p>
      </div>

      {/* Activity Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-xl font-semibold mb-4">Recent Activity</h3>
        <div className="space-y-3">
          {[
            { action: "Updated user permissions", time: "2 hours ago" },
            { action: "Created new dashboard report", time: "5 hours ago" },
            { action: "Modified system settings", time: "1 day ago" },
            { action: "Added 3 new users", time: "2 days ago" },
          ].map((activity, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <p className="text-gray-800">{activity.action}</p>
              <span className="text-sm text-gray-500">{activity.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Profile;
