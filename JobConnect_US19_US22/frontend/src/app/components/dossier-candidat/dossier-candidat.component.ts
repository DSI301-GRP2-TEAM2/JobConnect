import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CandidatureService } from '../../services/candidature.service';

@Component({
  selector: 'app-dossier-candidat',
  templateUrl: './dossier-candidat.component.html',
  styleUrls: ['./dossier-candidat.component.css']
})
export class DossierCandidatComponent implements OnInit {
  dossier: any = null;

  constructor(
    private route: ActivatedRoute,
    private candidatureService: CandidatureService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.candidatureService.getDossierCandidat(id).subscribe({
      next: (data) => {
        this.dossier = data;
      }
    });
  }

  changerStatut(nouveauStatut: 'ACCEPTEE' | 'REFUSEE'): void {
    this.candidatureService.updateStatut(this.dossier._id, nouveauStatut).subscribe({
      next: (res) => {
        this.dossier.statut = res.candidature.statut;
      }
    });
  }
}
