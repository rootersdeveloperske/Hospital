import reportsRouter from './routes/reports'
import alertsRouter from './routes/alerts'
import dashboardRouter from './routes/dashboard'

// ... earlier imports remain
app.use('/api/alerts', alertsRouter)
app.use('/api/dashboard', dashboardRouter)
app.use('/api/reports', reportsRouter)
