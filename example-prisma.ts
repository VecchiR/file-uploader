import { PrismaClient } from "./generated/prisma";

const prisma = new PrismaClient();

async function main() {
    // Create user
    const user = await prisma.user.create({
        data:{
            first_name: 'other',
            last_name: 'doe',
            email: 'other@gmail.com',
            hash: 'aaaa',
            salt:  'sssssss'
        }
    })

    // Get all users
    // const users = await prisma.user.findMany({
    //     include: {
    //         articles: true
    //     }
    // });

    // Create article and associate with user
    // const article = await prisma.article.create({
    //     data: {
    //         title: 'Johns first article',
    //         body: 'What a nice article it is',
    //         author: {
    //             connect: {
    //                 id: 1
    //             }
    //         }
    //     }
    // })

    // Get all articles
    // const articles = await prisma.article.findMany();

    // // Create user and article and associate them
    // const user = await prisma.user.create({
    //     data:{
    //         name:'sarah',
    //         email:'hehehe@gmail',
    //         articles:{
    //             create:{
    //                 title:'sarah article',
    //                 body:'nice one'
    //             }
    //         }
    //     }
    // })

    // Create another article for Sarah
    // const article = await prisma.article.create({
    //     data: {
    //         title: 'Sarahs second one',
    //         body: 'anothe one',
    //         author: {
    //             connect: {
    //                 id: 2
    //             }
    //         }
    //     }
    // })

    // Loop over users and articles
    // users.forEach((user) => {
    //     console.log(`User: ${user.name}, Email: ${user.email}`);
    //     console.log('Articles: ');
    //     user.articles.forEach(article => {
    //         console.log(`- Title: ${article.title}, Body: ${article.body}`);
    //     })
    //     console.log('\n');
        
    // })

    // Update data
    // const user = await prisma.user.update({
    //     where: {
    //         id:1
    //     },
    //     data: {
    //         name: 'John Doe Jr.'
    //     }

    // });

    // Remove data
    // const article = await prisma.article.delete({
    //     where:{
    //         id: 2
    //     }
    // })

    // console.log(articles);
}

main()
.then(async () => {
    await prisma.$disconnect();
})
.catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
})