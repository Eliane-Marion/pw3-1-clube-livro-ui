import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { LivroService } from '../../services/livro.service';
import { Livro } from '../../models/livro.model';

@Component({
  selector: 'app-livro-lista',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './livro-lista.component.html',
  styleUrl: './livro-lista.component.css'
})
export class LivroListaComponent implements OnInit {
  livros: Livro[] = [];
  formulario!: FormGroup;
  idEditando: number | null = null;
  mensagem = '';
  erro = '';

  constructor(private livroService: LivroService, private fb: FormBuilder) {
    this.formulario = this.fb.nonNullable.group({
      titulo: ['', Validators.required],
      dono: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.carregarLivros();
  }

  carregarLivros(): void {
    this.livroService.listarTodos().subscribe({
      next: dados => this.livros = dados,
      error: resposta => this.mostrarErro(resposta, 'Não foi possível carregar os livros.')
    });
  }

  salvar(): void {
    this.mensagem = '';
    this.erro = '';

    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    const livro: Livro = this.formulario.getRawValue();
    const editando = this.idEditando !== null;
    const pedido = editando
      ? this.livroService.editar(this.idEditando!, livro)
      : this.livroService.cadastrar(livro);

    pedido.subscribe({
      next: () => {
        this.mensagem = editando ? 'Livro atualizado!' : 'Livro cadastrado!';
        this.idEditando = null;
        this.formulario.reset();
        this.carregarLivros();
      },
      error: resposta => this.mostrarErro(resposta, 'Não foi possível salvar o livro.')
    });
  }

  editar(livro: Livro): void {
    this.idEditando = livro.id!;
    this.formulario.setValue({ titulo: livro.titulo, dono: livro.dono });
    this.mensagem = '';
    this.erro = '';
  }

  cancelarEdicao(): void {
    this.idEditando = null;
    this.formulario.reset();
    this.mensagem = '';
    this.erro = '';
  }

  emprestar(id: number): void {
    this.mensagem = '';
    this.erro = '';
    this.livroService.emprestar(id).subscribe({
      next: () => { this.mensagem = 'Empréstimo registrado!'; this.carregarLivros(); },
      error: resposta => this.mostrarErro(resposta, 'Não foi possível emprestar o livro.')
    });
  }

  devolver(id: number): void {
    this.mensagem = '';
    this.erro = '';
    this.livroService.devolver(id).subscribe({
      next: () => { this.mensagem = 'Livro devolvido!'; this.carregarLivros(); },
      error: resposta => this.mostrarErro(resposta, 'Não foi possível devolver o livro.')
    });
  }

  deletar(id: number): void {
    if (!confirm('Excluir este livro?')) return;
    this.mensagem = '';
    this.erro = '';
    this.livroService.deletar(id).subscribe({
      next: () => { this.mensagem = 'Livro excluído!'; this.carregarLivros(); },
      error: resposta => this.mostrarErro(resposta, 'Não foi possível excluir o livro.')
    });
  }

  private mostrarErro(resposta: HttpErrorResponse, mensagemPadrao: string): void {
    const corpo = resposta.error;
    const detalhe = typeof corpo === 'string' ? corpo : corpo?.detail || corpo?.message;
    this.erro = detalhe || mensagemPadrao;
    this.mensagem = '';
  }
}
