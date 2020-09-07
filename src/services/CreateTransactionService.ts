import { getCustomRepository, getRepository, Repository } from 'typeorm';
import AppError from '../errors/AppError';

import Transaction from '../models/Transaction';
import TransactionsRepository from '../repositories/TransactionsRepository';
import Category from '../models/Category';

interface RequestDTO {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: string;
}

class CreateTransactionService {
  public async execute({
    title,
    value,
    type,
    category,
  }: RequestDTO): Promise<Transaction> {
    if (!['income', 'outcome'].includes(type)) {
      throw new AppError('Transaction type is invalid', 400);
    }

    if (!category) {
      throw new AppError('Category is missing', 400);
    }

    const transactionRepository = getCustomRepository(TransactionsRepository);

    const { total } = await transactionRepository.getBalance();
    if (type === 'outcome' && total < value) {
      throw new AppError('You do not have enough balance', 400);
    }

    // validar se ja existe a categoria se nao criar
    const categoryRepository = getRepository(Category);
    const categoryExists = await categoryRepository.findOne({
      title: category,
    });
    const categoryFounded = await this.handlePostedCategory(
      categoryExists,
      categoryRepository,
      category,
    );

    const transaction = transactionRepository.create({
      title,
      value,
      type,
      category_id: categoryFounded.id,
    });

    await transactionRepository.save(transaction);
    return transaction;
  }

  private async handlePostedCategory(
    category: Category | undefined,
    repository: Repository<Category>,
    postedCategory: string,
  ): Promise<Category> {
    if (!category) {
      const _category = repository.create({
        title: postedCategory,
      });

      return repository.save(_category);
    }

    return category;
  }
}

export default CreateTransactionService;
