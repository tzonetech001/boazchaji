import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './user-management.component.html',
  styleUrls: ['./user-management.component.css']
})
export class UserManagementComponent implements OnInit {
  users: any[] = [];
  userForm: FormGroup;
  showForm = false;
  isEditing = false;
  currentEditId: number | null = null;
  
  // Kwa ajili ya Message
  message = { text: '', type: 'success' }; // 'success' au 'error'

  constructor(private apiService: ApiService, private fb: FormBuilder) {
    this.userForm = this.fb.group({
      first_name: ['', Validators.required],
      second_name: [''],
      last_name: ['', Validators.required],
      phone: ['', [Validators.required, Validators.pattern('^(07|06)[0-9]{8}$')]],
      email: [''],
      sex: ['Male', Validators.required],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
    this.apiService.getAgents().subscribe({
      next: (data) => this.users = data,
      error: () => this.showMessage('Hitilafu imetokea kupata watumiaji.', 'error')
    });
  }

  toggleForm() {
    this.showForm = !this.showForm;
    this.isEditing = false;
    this.currentEditId = null;
    this.userForm.reset({ sex: 'Male' });
  }

  editUser(user: any) {
    this.showForm = true;
    this.isEditing = true;
    this.currentEditId = user.id;
    this.userForm.patchValue({
      first_name: user.first_name,
      second_name: user.second_name || '',
      last_name: user.last_name,
      phone: user.phone,
      email: user.email || '',
      sex: user.sex
    });
  }

  onSubmit() {
    if (this.userForm.invalid) return;

    if (this.isEditing && this.currentEditId) {
      // Logic ya Kuedit (tutatumia API ya update)
      (this.apiService as any).updateAgent(this.currentEditId, this.userForm.value).subscribe({
        next: () => {
          this.showMessage('Mtumiaji amehaririwa kikamilifu!', 'success');
          this.loadUsers();
          this.toggleForm();
        },
        error: () => this.showMessage('Hitilafu wakati wa kuhariri.', 'error')
      });
    } else {
      // Logic ya Kuongeza
      this.apiService.addAgent(this.userForm.value).subscribe({
        next: () => {
          this.showMessage('Mtumiaji ameongezwa kikamilifu!', 'success');
          this.loadUsers();
          this.toggleForm();
        },
        error: (err) => this.showMessage(err.error.message || 'Hitilafu imetokea.', 'error')
      });
    }
  }

  deactivateUser(id: number) {
    if (confirm('Una uhakika unataka kumdeactivate mtumiaji huyu?')) {
      // Tutatumia API maalum kwa deactivate
      (this.apiService as any).updateAgent(id, { status: 'inactive' }).subscribe({
        next: () => {
          this.showMessage('Mtumiaji amedeactivate.', 'success');
          this.loadUsers();
        }
      });
    }
  }

  moveToTrash(id: number) {
    if (confirm('Una uhakika unataka kuweka mtumiaji huyu kwenye Trash?')) {
      (this.apiService as any).updateAgent(id, { status: 'inactive' }).subscribe({
        next: () => {
          this.showMessage('Mtumiaji amezimwa.', 'success');
          this.loadUsers();
        }
      });
    }
  }

  // Kipengele cha Message (Inaonekana kwa sekunde 2 kisha inatoweka)
  showMessage(text: string, type: 'success' | 'error') {
    this.message = { text, type };
    setTimeout(() => {
      this.message = { text: '', type: 'success' };
    }, 2000); // Sekunde 2
  }
}