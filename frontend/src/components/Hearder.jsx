import React from 'react'
import { Search, Bell } from 'lucide-react'

const Hearder = () => {
  return (
    <div>
       {/* Header */}
       <header className="bg-white shadow-sm px-6 py-4 sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div className="relative flex-1 max-w-xl">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search reports"
                className="w-full pl-10 pr-4 py-2 bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
              />
            </div>
            <div className="flex items-center space-x-4">
              <button className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-full transition">
                <Bell size={20} />
                <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              <div className="flex items-center space-x-3">
                <img
                  src="https://imgs.search.brave.com/HxsIMbItz_dQivtNgeLvbI7egmwxBXRKDd4oXXF0V6c/rs:fit:500:0:0:0/g:ce/aHR0cHM6Ly91cGxv/YWQud2lraW1lZGlh/Lm9yZy93aWtpcGVk/aWEvY29tbW9ucy90/aHVtYi9iL2I0L0xp/b25lbC1NZXNzaS1B/cmdlbnRpbmEtMjAy/Mi1GSUZBLVdvcmxk/LUN1cF8lMjhjcm9w/cGVkJTI5LmpwZy81/MTJweC1MaW9uZWwt/TWVzc2ktQXJnZW50/aW5hLTIwMjItRklG/QS1Xb3JsZC1DdXBf/JTI4Y3JvcHBlZCUy/OS5qcGc"
                  alt="Profile"
                  className="w-10 h-10 rounded-full border-2 border-white shadow-sm"
                />
                <div>
                  <div className="font-medium">Kamesh</div>
                  <div className="text-xs text-gray-500">Citizen</div>
                </div>
              </div>
            </div>
          </div>
        </header>
    </div>
  )
}

export default Hearder
