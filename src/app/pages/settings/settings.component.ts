import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css']
})
export class SettingsComponent implements OnInit {
  agents: any[] = [];
  agentForm: FormGroup;
  showForm = false;
  isLoading = true;
  successMessage = '';
  errorMessage = '';

  constructor(private apiService: ApiService, private fb: FormBuilder) {
    this.agentForm = this.fb.group({
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
    this.loadAgents();
  }

  loadAgents() {
    this.apiService.getAgents().subscribe({
      next: (data) => {
        this.agents = data;
        this.isLoading = false;
      },
      error: () => this.isLoading = false
    });
  }

  toggleForm() {
    this.showForm = !this.showForm;
    this.successMessage = '';
    this.errorMessage = '';
    this.agentForm.reset({ sex: 'Male' });
  }

  onSubmit() {
    if (this.agentForm.invalid) return;

    this.apiService.addAgent(this.agentForm.value).subscribe({
      next: (res) => {
        this.successMessage = res.message;
        this.agentForm.reset({ sex: 'Male' });
        this.loadAgents();
        setTimeout(() => this.showForm = false, 2000);
      },
      error: (err) => {
        this.errorMessage = err.error.message || 'Hitilafu imetokea.';
      }
    });
  }

  deleteAgent(id: number) {
    if (confirm('Una uhakika unataka kumfuta agent huyu?')) {
      this.apiService.deleteAgent(id).subscribe({
        next: () => this.loadAgents()
      });
    }
  }
}