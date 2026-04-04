const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-gray-200 mt-auto">
      <div className="px-4 py-3">
        <div className="w-full mx-auto">
          {/* Main Footer */}
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            {/* Left */}
            <div className="text-center md:text-left">
              <div className="flex items-center gap-2 justify-center md:justify-start mb-2">
                <div className="w-6 h-6 rounded-lg bg-blue-600 flex items-center justify-center">
                  <span className="text-white font-bold text-xs">VM</span>
                </div>
                <span className="font-bold text-gray-900">VET CMU</span>
              </div>
            </div>

            {/* Center Links */}
            <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-600">
              <p className="text-sm text-gray-600">
                © {currentYear} VET CMU. สงวนลิขสิทธิ์.
              </p>
            </div>

            {/* Right */}
            {/* <div className="flex items-center gap-2 text-sm text-gray-500">
              <a
                href="/privacy"
                className="hover:text-gray-900 transition-colors"
              >
                นโยบายความเป็นส่วนตัว
              </a>
              <a
                href="/terms"
                className="hover:text-gray-900 transition-colors"
              >
                ข้อกำหนด
              </a>
              <a
                href="/contact"
                className="hover:text-gray-900 transition-colors"
              >
                ติดต่อ
              </a>
            </div> */}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
