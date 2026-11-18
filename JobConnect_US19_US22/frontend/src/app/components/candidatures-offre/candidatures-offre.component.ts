import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CandidatureService } from '../../services/candidature.service';

@Component({
  selector: 'app-candidatures-offre',
  templateUrl: './candidatures-offre.component.html',
  styleUrls: ['./candidatures-offre.component.css']
})
export class CandidaturesOffreComponent implements OnInit {
  candidatures: any[] = [];
  offreTitre: string = '';

  constructor(
    private route: ActivatedRoute,
    private candidatureService: CandidatureService
  ) {}

  ngOnInit(): void {
    const offreId = this.route.snapshot.paramMap.get('id')!;
    this.candidatureService.getCandidaturesByOffre(offreId).subscribe({
      next: (res) => {
        this.offreTitre = res.offreTitre;
        this.candidatures = res.candidatures;
      }
    });
  }
}
