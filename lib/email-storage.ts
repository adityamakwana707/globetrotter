// Email storage for development preview
// This stores emails in memory for development viewing

interface StoredEmail {
  id: string
  from: string
  to: string
  subject: string
  html: string
  timestamp: Date
}

class EmailStorage {
  private emails: StoredEmail[] = []
  private maxEmails = 50 // Keep last 50 emails

  addEmail(email: Omit<StoredEmail, 'id' | 'timestamp'>): string {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9)
    const storedEmail: StoredEmail = {
      ...email,
      id,
      timestamp: new Date()
    }
    
    this.emails.unshift(storedEmail) // Add to beginning
    
    // Keep only the latest emails
    if (this.emails.length > this.maxEmails) {
      this.emails = this.emails.slice(0, this.maxEmails)
    }
    
    return id
  }

  getAllEmails(): StoredEmail[] {
    return this.emails
  }

  getEmailById(id: string): StoredEmail | undefined {
    return this.emails.find(email => email.id === id)
  }

  clearEmails(): void {
    this.emails = []
  }
}

export const emailStorage = new EmailStorage()
