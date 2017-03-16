package org.seckill.service;

import org.junit.Test;
import org.junit.runner.RunWith;
import org.seckill.dto.Exposer;
import org.seckill.dto.SeckillExecution;
import org.seckill.entity.Seckill;
import org.seckill.exception.RepeatKillException;
import org.seckill.exception.SeckillCloseException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.context.junit4.SpringJUnit4ClassRunner;

import java.util.List;

import static org.junit.Assert.*;


@RunWith(SpringJUnit4ClassRunner.class)
@ContextConfiguration({
        "classpath:spring/spring-dao.xml",
        "classpath:spring/spring-service.xml"})
public class SeckillServiceTest {

    //slf4j是接口，logback才是实现
    private final Logger logger = LoggerFactory.getLogger(this.getClass());

    @Autowired
    private SeckillService seckillService;

    @Test
    public void getSeckillList() throws Exception {

        List<Seckill> list = seckillService.getSeckillList();
        logger.info("list={}",list);
        //Closing non transactional SqlSession 没有事务控制
    }

    @Test
    public void getById() throws Exception {

        long id = 1000;
        Seckill seckill = seckillService.getById(id);
        logger.info("seckill={}",seckill);
    }

    @Test
    /**
     * 如果md5为NULL，就是现在的时间不在秒杀时间范围内
     */
    public void exportSeckillUrl() throws Exception {

        long id = 1000;
        Exposer exposer = seckillService.exportSeckillUrl(id);
        logger.info("exposer={}",exposer);

    }

    @Test
    /**
     * 如果该商品在SuccessKilled表中有此电话秒杀，则不能重复秒杀，junit报错
     * 但是可以在这个test中加入catch就不会抛给Junit
     */
    public void executeSeckill() throws Exception {

        long id = 1000;
        long phone = 18787125628L;
        String md5 = "66160fbb9096b40283a30043603d17e7";
        SeckillExecution seckillExecution = seckillService.executeSeckill(id, phone, md5);
        logger.info("ScekillExecution={}",seckillExecution);

    }

    /**
     * 上面两个方法汇总
     * 有了catch可以重复执行，但是不会commit
     * @throws Exception
     */
    @Test
    public void testSeckillLogic() throws Exception {

        long id = 1001;
        Exposer exposer = seckillService.exportSeckillUrl(id);
        if (exposer.isExposed()) {
            logger.info("exposer={}", exposer);
            long phone = 18787125629L;
            String md5 = exposer.getMd5();
            try {
                SeckillExecution seckillExecution = seckillService.executeSeckill(id, phone, md5);
                logger.info("ScekillExecution={}", seckillExecution);
            } catch (RepeatKillException e) {
                logger.error(e.getMessage());
            } catch (SeckillCloseException e1) {
                logger.error(e1.getMessage());
            }
        } else {
            //秒杀未开启
            logger.info("exposer={}",exposer);
        }
    }

    /**
     * 测试存储过程
     */
    @Test
    public void executeSeckillProcedure(){
        long seckillId = 1000;
        long phone = 18787126532L;
        Exposer exposer = seckillService.exportSeckillUrl(seckillId);
        if (exposer.isExposed()) {
            String md5 = exposer.getMd5();
            SeckillExecution execution = seckillService.executeSeckillProcedure(seckillId, phone, md5);
            logger.info(execution.getStateInfo());
        }

    }
}