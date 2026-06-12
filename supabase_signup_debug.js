const url = 'https://cekhevnszaqbupmtffto.supabase.co/auth/v1/signup'
const body = { email: 'debug.signup.test@gmail.com', password: 'Passw0rd!' }
console.log('REQUEST URL:', url)
console.log('REQUEST BODY:', JSON.stringify(body))

const response = await fetch(url, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    apikey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNla2hldm5zemFxYnVwbXRmZnRvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEwOTc5MjEsImV4cCI6MjA5NjY3MzkyMX0.XjV6cjEBGuZsXjFpBR0dJ_FMpuNwFAQpLqzfV4zQx1o',
    Authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNla2hldm5zemFxYnVwbXRmZnRvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEwOTc5MjEsImV4cCI6MjA5NjY3MzkyMX0.XjV6cjEBGuZsXjFpBR0dJ_FMpuNwFAQpLqzfV4zQx1o'
  },
  body: JSON.stringify(body)
})

console.log('STATUS:', response.status)
const text = await response.text()
console.log('BODY:', text)
