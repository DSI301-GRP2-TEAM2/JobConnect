import { Component, OnInit } from '@angular/core';
import { CandidatureService } from '../../services/candidature.service';

@Component({
  selector: 'app-mes-candidatures',
  templateUrl: './mes-candidatures.component.html',
  styleUrls: ['./mes-candidatures.component.css']
})
export class MesCandidaturesComponent implements OnInit {
  mesCandidatures: any[] = [];

  constructor(private candidatureService: CandidatureService) {}

  ngOnInit(): void {
    this.candidatureService.getMesCandidatures().subscribe({
      next: (data) => {
        this.mesCandidatures = data;
      }
    });
  }
}
