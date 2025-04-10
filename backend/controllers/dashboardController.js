// dashboardController.js

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();


const getDashboardStats = async (req, res) => {
  try {
    // Validate user from token
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        status: 'error',
        message: 'Unauthorized: User not authenticated properly'
      });
    }
    
    const { id, role } = req.user;
    
    // Get municipality of the logged-in user
    const user = await prisma.users.findUnique({
      where: { user_id: parseInt(id) },
      select: { municipality: true, wardNumber: true, role: true }
    });
    
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }
    
    // Check if user has municipality assigned
    if (!user.municipality) {
      return res.status(400).json({
        status: 'error',
        message: 'Municipality not found for this user'
      });
    }
    
    // Verify user role
    if (role !== 'MUNICIPALITY' && role !== 'ADMIN') {
      return res.status(403).json({
        status: 'error',
        message: 'Forbidden: Insufficient permissions'
      });
    }
    
    const municipality = user.municipality;
    
    // Get all the counts in a single query
    const [
      usersCount,
      reportsCount,
      activeIssuesCount
    ] = await Promise.all([
      // Count only regular users, not municipality or admin users
      prisma.users.count({
        where: {
          municipality: municipality,
          isVerified: 'ACCEPT',
          role: 'USER' // Only count regular users
        }
      }),
      
      // Count reports
      prisma.reports.count({
        where: { municipality }
      }),
      
      // Count active issues
      prisma.reports.count({
        where: {
          municipality,
          status: {
            in: ['PENDING', 'IN_PROGRESS']
          }
        }
      })
    ]);
    
    return res.status(200).json({
      status: 'success',
      data: {
        users: usersCount,
        reports: reportsCount,
        activeIssues: activeIssuesCount
      }
    });
  } catch (error) {
    console.error('Error getting dashboard stats:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to get dashboard statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};


const getDashboardActivities = async (req, res) => {
  try {
    // Validate user from token
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        status: 'error',
        message: 'Unauthorized: User not authenticated properly'
      });
    }
    
    const { id, role } = req.user;
    
    // Log for debugging
    console.log('User data from token for activities:', { id, role });
    
    // Get municipality of the logged-in user
    const user = await prisma.users.findUnique({
      where: { user_id: parseInt(id) },
      select: { municipality: true, wardNumber: true, role: true }
    });
    
    console.log('Found user for activities:', user);
    
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }
    
    if (!user.municipality) {
      return res.status(400).json({
        status: 'error',
        message: 'Municipality not found for this user'
      });
    }
    
    // Verify user role
    if (role !== 'MUNICIPALITY' && role !== 'ADMIN') {
      return res.status(403).json({
        status: 'error',
        message: 'Forbidden: Insufficient permissions'
      });
    }
    
    const municipality = user.municipality;
    
    // Get recent reports with user information
    const recentReports = await prisma.reports.findMany({
      where: { 
        municipality 
      },
      orderBy: { 
        createdAt: 'desc' 
      },
      take: 5,
      include: {
        user: {
          select: {
            user_name: true,
            profilePicture: true
          }
        }
      }
    });
    
    // Format the activities for the frontend
    const activities = recentReports.map(report => ({
      id: report.report_id,
      title: report.title,
      description: report.description,
      date: report.createdAt,
      status: report.status,
      type: 'REPORT',
      user: {
        name: report.user.user_name,
        profilePicture: report.user.profilePicture
      }
    }));
    
    return res.status(200).json({
      status: 'success',
      data: activities
    });
  } catch (error) {
    console.error('Error getting dashboard activities:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to get dashboard activities',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};



module.exports = {
  getDashboardStats,
  getDashboardActivities,
};